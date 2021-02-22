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

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const connectionTableName = process.env.CONNECTIONS_TABLE_NAME;
const playersTableName = process.env.PLAYERS_TABLE_NAME;

async function sendData(msgcontent, connectionData, domain, tablename, stage) {
  delete msgcontent.domainName;
  delete msgcontent.stage;
  delete msgcontent.message.domainName;
  delete msgcontent.message.stage;
  const props = {
    apiVersion: '2018-11-29',
    endpoint: `${domain}/${stage}`,
  };
  const apigwManagementApi = new AWS.ApiGatewayManagementApi( props );

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    try {
      await apigwManagementApi.postToConnection(
        { ConnectionId: connectionId, Data: JSON.stringify(msgcontent) },
      ).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.warn(`Found stale connection, deleting ${connectionId}`);
        if (tablename === connectionTableName) {
          await ddb.delete({ TableName: tablename, Key: { connectionId } }).promise();
        }
      } else {
        console.error(`Error with websocket connections ${JSON.stringify(e)} using ${JSON.stringify(props)}`);
        return { statusCode: 500, body: 'error with websocket connections' };
      }
    }
    return { statusCode: 200, body: 'all sent' };
  });
  try {
    await Promise.all(postCalls);
  } catch (e) {
    console.error(`Error with promises and table ${tablename}: ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Error awaiting promises' };
  }
  return { statusCode: 200, body: 'messages sent' };
}

async function formatMessage(msg) {
  const msgcontent = {};
  let data = {};

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

async function getData(msg) {
  let connectionData;
  let parms;

  switch (msg.action) {
    case 'chat':
      try {
        connectionData = await ddb.scan({
          TableName: connectionTableName,
          ProjectionExpression: 'connectionId',
        }).promise();
      } catch (e) {
        console.error(`Error getting chat connection data ${JSON.stringify(e)}`);
        return { statusCode: 500, body: 'Error getting chat connection data' };
      }
      break;
    case 'liveadmin':
      // send the received question to all in the gametable
      parms = {
        TableName: playersTableName,
        KeyConditionExpression: '#f1 = :v1 and #f2 = :v2',
        ExpressionAttributeValues: { ':v1': msg.gameId, ':v2': 'PLAYER' },
        ExpressionAttributeNames: { '#f1': 'gameId', '#f2': 'role' },
        IndexName: 'GameRole',
        ConsistentRead: true,
      };
      try {
        connectionData = await ddb.query(parms).promise();
      } catch (e) {
        console.error(`Error getting liveadmin connection data ${JSON.stringify(e)}`);
        return { statusCode: 500, body: 'Error getting live connection data' };
      }
      break;
    case 'liveplayer':
      // send only to host
      parms = {
        TableName: playersTableName,
        ProjectionExpression: 'connectionId',
        KeyConditionExpression: '#f1 = :v1 and #f2 = :v2',
        ExpressionAttributeValues: { ':v1': msg.gameId, ':v2': 'HOST' },
        ExpressionAttributeNames: { '#f1': 'gameId', '#f2': 'role' },
        IndexName: 'GameRole',
        ConsistentRead: true,
      };
      try {
        connectionData = await ddb.query(parms).promise();
      } catch (e) {
        console.error(`Error getting liveplayer connection data ${JSON.stringify(e)}`);
        return { statusCode: 500, body: 'Error getting liveplayer connection data' };
      }
      break;
    default:
      console.error(`Case not defined for ${msg.action}`);
      break;
  }
  return connectionData;
}

exports.SendChat = async (msg) => {
  let stage = msg.stage;
  const connectionData = await getData(msg);
  const msgcontent = await formatMessage(msg);
  if (Object.prototype.hasOwnProperty.call(connectionData, 'statusCode')) {
    if (connectionData.statusCode === 500) {
      return connectionData;
    }
  }
  const val = await sendData(msgcontent, connectionData, msg.domainName, playersTableName, stage);

  return (val);
};
