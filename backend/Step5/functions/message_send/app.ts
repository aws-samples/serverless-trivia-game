/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// SPDX-License-Identifier: MIT-0

// Function: SendChat:app.js

/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint consistent-return: "error" */
/* eslint no-inner-declarations: "error" */

import AWS from 'aws-sdk';

const playersTableName: string = process.env.PLAYERS_TABLE_NAME!;
const region: string = process.env.REGION!;

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: region });

const ddb = new AWS.DynamoDB.DocumentClient();

const sendData = async(msgcontent: any, connectionData: any, domain: string, tablename: string, stage: string): Promise<any> => {
  delete msgcontent.domainName;
  delete msgcontent.stage;
  delete msgcontent.message.domainName;
  delete msgcontent.message.stage;
  const props = {
    apiVersion: '2018-11-29',
    endpoint: `${domain}/${stage}`,
  };
  const apigwManagementApi = new AWS.ApiGatewayManagementApi( props );

  const postCalls = connectionData.Items.map(async ({ connectionId:any }) => {
    try {
      let connId: string = connectionId!;
      await apigwManagementApi.postToConnection(
        { ConnectionId: connectionId, Data: JSON.stringify(msgcontent) },
      ).promise();
    } catch (e) {
      console.log(`${JSON.stringify(e)}`);
      if (e.statusCode !== 410) {
        console.error(`Error with websocket connections ${JSON.stringify(e)} using ${JSON.stringify(props)}`);
        return { statusCode: 500, body: 'error with websocket connections' };
      } else {
        console.log(`got a 410`);
      }
    }
  });
  try {
    console.log(`now sending all messages`)
    await Promise.all(postCalls);
  } catch (e) {
    console.error(`Error with promises and table ${tablename}: ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Error awaiting promises' };
  }
}

const formatMessage = async(msg: any): Promise<any> => {
  let msgcontent: any = {};
  let data: any = {};

  switch (msg.action) {
    case 'chat':
      msgcontent.message = `${msg.userName} says '${msg.message}'`;
      msgcontent.channel = msg.channel;
      break;
    case 'liveadmin':
      msgcontent.channel = 'liveadmin';
      data = msg;
      data.action = msg.subaction;
      msgcontent.message = data;
      break;
    case 'liveplayer':
      msgcontent.channel = 'liveplayer';
      data = msg;
      data.action = msg.subaction;
      data.playerAction = msg.subaction;
      msgcontent.message = data;
      break;
    default:
      console.error(`action for ${msg.action} not defined`);
  }
  return msgcontent;
}

async function getData(msg: any): Promise<any> {
  let connectionData: any = {};
  let parms;

  switch (msg.action) {
    case 'chat':
      //deprecated
      return {};
      break;
    case 'liveadmin':
      // send the received question to all in the gametable
      console.log('working on a liveadmin')
      const lapk = msg.gameId +'#'+msg.playerName;
      parms = {
        TableName: playersTableName,
        ProjectionExpression: 'connectionId',        
        KeyConditionExpression: '#f1 = :v1 and begins_with(#f2, :v2)',
        ExpressionAttributeValues: { ':v1': lapk, ':v2': 'PLAYER' },
        ExpressionAttributeNames: { '#f1': 'pk', '#f2': 'sk' },
        ConsistentRead: true,
      };
      try {
        connectionData = await ddb.query(parms).promise();
        return connectionData;
      } catch (e) {
        console.error(`Error getting liveadmin connection data ${JSON.stringify(e)}`);
        return { };
      }
    case 'liveplayer':
      // send only to host
      console.log('working on a liveplayer')
      const lppk = msg.gameId + '#' + msg.hostname;
      parms = {
        TableName: playersTableName,
        ProjectionExpression: 'connectionId',
        KeyConditionExpression: '#f1 = :v1 and begins_with(#f2, :v2)',
        ExpressionAttributeValues: { ':v1': lppk, ':v2': 'HOST' },
        ExpressionAttributeNames: { '#f1': 'pk', '#f2': 'sk' },
        ConsistentRead: true,
      };
      try {
        connectionData = await ddb.query(parms).promise();
        return connectionData;
      } catch (e) {
        console.error(`Error getting liveplayer connection data ${JSON.stringify(e)}`);
        return {};
      }
    default:
      console.error(`Case not defined for ${msg.action}`);
      return {};
  }
}

export const handler = async (event: any) => {
  console.log(JSON.stringify(event));
  const msg: any = event.detail;
  console.log(JSON.stringify(msg));
  let stage = msg.stage;
  const connectionData: any = await getData(msg);
  const msgcontent: any = await formatMessage(msg);
  console.log(`connectionData = ${JSON.stringify(connectionData)}`)
  console.log(`msgContent = ${JSON.stringify(msgcontent)}`)
  if (!connectionData || (connectionData.statusCode && connectionData.statusCode === 500)) {
    console.log(`fell in the bad spot`)
    return connectionData;
  }
  const val = await sendData(msgcontent, connectionData, msg.domainName!, playersTableName, stage);

  return (val);
};