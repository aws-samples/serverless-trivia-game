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

// Function: livegameplayer:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-param-reassign: ["error", { "props": false }] */
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const playersTableName: string = process.env.PLAYERS_TABLE_NAME!;
const eventBusName: string = process.env.EVENT_BUS_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const eb = new EventBridgeClient({region: region});

const postData = async(client: ApiGatewayManagementApiClient, connectionId: string, message: any ): Promise<void> => {

    try {
      console.log(`sending ${JSON.stringify(message)} to ${connectionId}`);
      const result = await client.send(new PostToConnectionCommand({ConnectionId: connectionId, 
        Data: new TextEncoder().encode(JSON.stringify(message))}));
      console.log(`I am the line after sending PostToConnection`)
      console.log(`result from PostToConnection ${JSON.stringify(result)}`);
      return;
    } catch(e) {
        console.error(`Error with websocket connections ${JSON.stringify(e)}`);
        const { requestId, cfId, extendedRequestId } = e.$$metadata;
        console.error({ requestId, cfId, extendedRequestId });
        //return { statusCode: 500, body: 'error with websocket connections' };
    }
}

const sendData = async(msgcontent: any, connectionData: any, domain: string, stage: string): Promise<any> => {
  delete msgcontent.domainName;
  delete msgcontent.stage;
  delete msgcontent.message.domainName;
  delete msgcontent.message.stage;

  const apigwManagementApi = new ApiGatewayManagementApiClient({ endpoint:  `https://${domain}/${stage}` });

  //loop through connections and call another function to send the data

  const promises = await connectionData.Items.map( async (connection:any) => {
    const promise = await postData(apigwManagementApi, connection.connectionId, msgcontent);
    return promise;
  });

  const retVal = await Promise.all(promises)

  return { statusCode: 200, body: 'all sent' };
}

const formatMessage = async(msg:any) => {
  console.log(`format message ${JSON.stringify(msg)}`);
  let msgcontent = {};
  
  switch (msg.action) {
    case 'chat':
      msgcontent = { 
        message: `${msg.userName} says '${msg.message}'`,
        channel: msg.channel 
      }
      break;
    case 'liveadmin':
      let liveadmindata = msg;
      liveadmindata.action = msg.subaction;
      msgcontent = {
        channel: 'liveadmin',
        message: liveadmindata
      }
      break;
    case 'liveplayer':
      let liveplayerdata = msg
      liveplayerdata.action = msg.subaction;
      liveplayerdata.playerAction = msg.subaction;
      msgcontent =  {channel: 'liveplayer', 
        message: liveplayerdata
      }
      break;
    default:
      console.error(`action for ${msg.action} not defined`);
  }
  return msgcontent;
}

const getData = async(msg: any) => {
  let connectionData;

  switch (msg.action) {
    case 'chat':
      //deprecated
      break;
    case 'liveadmin':
      // send the received question to all in the gametable
      const lapk = msg.gameId +'#'+msg.playerName;
      try {
        connectionData = await ddbDocClient.send(new QueryCommand({
          TableName: playersTableName,
          ProjectionExpression: 'connectionId',        
          KeyConditionExpression: '#f1 = :v1 and begins_with(#f2, :v2)',
          ExpressionAttributeValues: { ':v1': lapk, ':v2': 'PLAYER' },
          ExpressionAttributeNames: { '#f1': 'pk', '#f2': 'sk' },
          ConsistentRead: true,
        }));
        return connectionData;
      } catch (e) {
        console.error(`Error getting liveadmin connection data ${JSON.stringify(e)}`);
        return { Items: []  };
      }
      break;
    case 'liveplayer':
      // send only to host
      const lppk = msg.gameId + '#' + msg.hostname;
      try {
        connectionData = await ddbDocClient.send(new QueryCommand({
          TableName: playersTableName,
          ProjectionExpression: 'connectionId',
          KeyConditionExpression: '#f1 = :v1 and begins_with(#f2, :v2)',
          ExpressionAttributeValues: { ':v1': lppk, ':v2': 'HOST' },
          ExpressionAttributeNames: { '#f1': 'pk', '#f2': 'sk' },
          ConsistentRead: true,
        }))
        return connectionData;
      } catch (e) {
        console.error(`Error getting liveplayer connection data ${JSON.stringify(e)}`);
        return { Items: [] };
      }
    default:
      console.error(`Case not defined for ${msg.action}`);
      return { Items: [] };
  }
  
}

const SendChat = async (msg: any): Promise<any> => {
  console.log(`sendchat ${JSON.stringify(msg)}`);
  let stage = msg.stage;
  const connectionData = await getData(msg);
  const msgcontent = await formatMessage(msg);
  console.log(`sending data via websocket in livegameplayer`)
  return await sendData(msgcontent, connectionData, msg.domainName, stage);
};

const joingame = async(incoming: any, connectionId: string, domainName: string, stage: string) => {
  console.log(`joining game `)
  try {
    const activeGameResponse = await ddbDocClient.send(new GetCommand({
      TableName: playerInventoryTableName,
      Key: { pk: incoming.playerName, sk: incoming.gameId }
    }));
    if (!activeGameResponse.Item) {
      console.error(`invalid game info ${JSON.stringify(activeGameResponse)}`);
      return { statusCode: 500, body: JSON.stringify({ data: 'Invalid game' }) };
    }
    console.log(`storing connection`);
    await ddbDocClient.send(new PutCommand({
      TableName: playersTableName,
      Item: {
        pk: `${incoming.gameId}#${incoming.hostname}`,
        sk: `PLAYER=${connectionId}`,
        playerName: incoming.username,
        connectionId: connectionId,
        gameId: incoming.gameId
      }
    }));
    const message = {
      action: 'liveplayer', domainName: domainName, stage: stage,
      playerName: incoming.username, subaction: 'joined',
      pk: `${incoming.gameId}#${incoming.hostname}`,
      gameId: incoming.gameId, hostname: incoming.hostname
    };
    console.log(`sending ${JSON.stringify(message)}`);
    await SendChat(message);
    const data = {
      gameId: `${incoming.gameId}#${incoming.hostname}`,
      quizName: activeGameResponse.Item.quizName,
      hostname: incoming.hostname,
    };
    const msg = {
      channel: 'joinedlive',
      message: data
    }
    return { statusCode: 200, body: JSON.stringify(msg) };

  } catch (e) {
    console.error(`${JSON.stringify({ pk: incoming.playerName, sk: incoming.gameId })}`);
    console.error(`error getting game data ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Error getting game data' };
  }
}

const chat = async(message: any, domainName: string, stage: string) => {
  console.log(`in chat`);
  message.domainName = domainName;
  message.stage = stage;
  message.action = 'chat';
  return await SendChat(message);
}

export const handler = async (event: any) => {
  console.log(`${JSON.stringify(event)}`)
  let message: any = {};
  let val: any = {};
  message = JSON.parse(event.body).data;
  message.domainName = event.requestContext.domainName;
  message.stage = event.requestContext.stage;
  switch (message.subaction) {
    case 'joingame':
      return joingame(message, event.requestContext.connectionId,
        event.requestContext.domainName, event.requestContext.stage);
    case 'chat':
      return chat(message, event.requestContext.domainName, event.requestContext.stage);
    default:
      console.warn(`no case defined for ${message.subaction}`);
      message.action = 'liveplayer';
      val = await SendChat(message);
      return val;
  }
};