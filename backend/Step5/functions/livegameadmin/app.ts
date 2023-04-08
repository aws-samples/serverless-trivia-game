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

// Function: livegameadmin:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-param-reassign: ["error",
  { "props": true, "ignorePropertyModificationsFor": ["gameInfo"] }] */
/* eslint no-case-declarations: "error" */

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const playerProgressTopic: string = process.env.PLAYER_PROGRESS_TOPIC!;
const highscoreTableName: string = process.env.SCORES_TABLE_NAME!;
const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const playersTableName: string = process.env.PLAYERS_TABLE_NAME!;
const scoreStream: string = process.env.RESPONSE_STREAM!;
const chatTopicArn: string = process.env.CHAT_TOPIC_ARN!;
const eventBusName: string = process.env.EVENT_BUS_NAME!;
const region: string = process.env.REGION!;


const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const sns = new SNSClient({region: region});
const kinesis = new KinesisClient({region: region});
const eb = new EventBridgeClient({region: region});

const dateString = () => {
  const date = new Date();
  return `${(`00${date.getMonth() + 1}`).slice(-2)}/${
    (`00${date.getDate()}`).slice(-2)}/${
    date.getFullYear()} ${
    (`00${date.getHours()}`).slice(-2)}:${
    (`00${date.getMinutes()}`).slice(-2)}:${
    (`00${date.getSeconds()}`).slice(-2)}`;
}

const postData = async(client: ApiGatewayManagementApiClient, connectionId: string, message: any ): Promise<void> => {

    try {
      console.log(`sending ${JSON.stringify(message)} to ${connectionId}`);
      const result = await client.send(new PostToConnectionCommand({ConnectionId: connectionId, 
        Data: new TextEncoder().encode(JSON.stringify(message))}));
      console.log(`I am the line after sending PostToConnection`)
      console.log(`result from PostToConnection ${JSON.stringify(result)}`);
      return;
    } catch(e) {
      //if (e.statusCode !== 410) {
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

const SendChat = async (msg: any) => {
  console.log(`SENDCHAT msg: ${JSON.stringify(msg)}`);
  let stage = msg.stage;
  const connectionData = await getData(msg);
  const msgcontent = await formatMessage(msg);
  console.log(`sending data via websocket in livegameadmin`)
  return await sendData(msgcontent, connectionData, msg.domainName, stage);
};

const UpdatePlayerInventory = async(gameInfo: any) => {
  try {
    const gameId = gameInfo.gameId;
    const gameType = 'LIVE=' + gameInfo.playerName;
    const starttime = gameInfo.starttime;
    const host = gameInfo.playerName;
    await eb.send(new PutEventsCommand({
      Entries: [{
        DetailType: "Websockets.game_host"  ,
        Source: 'sts',
        Detail: JSON.stringify({gameId, host, gameType, starttime}),
        EventBusName: eventBusName
      }]      
    }));
    return {statusCodde: 200, body: "Successs"};
  } catch (e) {
    console.error(`could not store game: ${e}`);
    return { statusCode: 500, body: JSON.stringify({ data: e }) };
  }
}

const AddHostConnection = async(gameInfo: any, connectionId: string) => {
  //changes for new table
  const Item = {
    pk: `${gameInfo.gameId}#${gameInfo.playerName}`,
    sk: `HOST=${connectionId}`,
    connectionId: connectionId,
    playerName: gameInfo.playerName,
    gameId: gameInfo.gameId
  }
  try {
    const val = await ddbDocClient.send(new PutCommand({
      TableName: playersTableName,
      Item
    }));
    return {statusCodde: 200, body: "Successs"};
  } catch (e) {
    console.error(`Error hosting game ${JSON.stringify(e)}`);
    return {statusCodde: 500, body: "Error hosting game"};
  }
}

const GetQuestions = async(gameInfo: any) => {
  // load question array for host
  console.log(`getting questions`)
  try {
    const quizHeader = await ddbDocClient.send(new GetCommand({
      TableName: playerInventoryTableName,
      Key: {sk: gameInfo.gameId, pk: gameInfo.playerName}  
    }));
    if(quizHeader.Item) {
      return {
        question: quizHeader.Item.questions,
        channel: 'livestart',
        quizname: quizHeader.Item.quizName,
        gameId: quizHeader.Item.gameId,
        questionType: quizHeader.Item.questionType,
        quizMode: quizHeader.Item.quizMode
      }
    } else {
      return {statusCodde: 200, body: "Successs"};
    }
  } catch (e) {
    console.error(`quizHeader ${JSON.stringify({sk: gameInfo.gameId, pk: gameInfo.playerName})}`);
    console.error(`Error getting game ${e}`);
    return { statusCode: 500, body: 'Looks like an invalid game' };
  }
}

const hostGame = async(gameInfo: any, connectionId: string) => {
  // store the game to be hosted
  delete gameInfo.subaction; //
  gameInfo.hostConnection = connectionId;
  const parms = {Item: gameInfo};
  //Need to delete any reference to other live games
  //query the table, find them, delete them
  await UpdatePlayerInventory(gameInfo);
  await AddHostConnection(gameInfo, connectionId);
  const returnMessage = await GetQuestions(gameInfo);

  // user, channel, message
  try {
    await sns.send(new PublishCommand({
      TopicArn: chatTopicArn,
      Message: `${gameInfo.playerName} says "Hosting game: ${gameInfo.quizName}"`,
      Subject: 'globalchat'
    }));
    return { statusCode: 200, body: JSON.stringify(returnMessage) };
  } catch (e) {
    console.error(`error sending sns message ${e}`);
    return { statusCode: 500, body: "could not send sns messaage" };
  }
}

const sendMessages = async(analytics: any) => {
  const Data = JSON.stringify({ playerName: analytics.playerName, gameId: analytics.gameId, 
    dateOfQuiz: dateString(), quizMode: analytics.quizMode, 
    questions: analytics.questions });
  let val = await kinesis.send(new PutRecordCommand({
    Data: new TextEncoder().encode(Data), StreamName: scoreStream, PartitionKey: 'score001'
  }))
  if(val.SequenceNumber) {
    return { statusCode: 200, body: 'analytics sent' };
  } else {
    console.error(`error writing to shard: ${JSON.stringify(val)} `);
    return { statusCode: 500, body: 'error sending to kinesis' };
  }
}

const updateProgress = async(progress: any) => {
  try {
    await sns.send(new PublishCommand({ 
      Message: JSON.stringify(progress), TopicArn: playerProgressTopic 
    }));
    return { statusCode: 200, body: "success" };
  } catch (e) {
    console.error(`Error with progress ${JSON.stringify(progress)}`);
    return { statusCode: 500, body: e };
  }
}

export const handler = async (event: any) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  let val = {statusCode: 400, body: "could not find switch"};
  let message = JSON.parse(event.body).data;
  console.log(`MESSAGE: ${JSON.stringify(message)}`);
  switch (message.subaction) {
    case 'hostgame':
      val = await hostGame(message, event.requestContext.connectionId);
      return val;
    case 'scoreboardupdate':
      try {
        await ddbDocClient.send(new PutCommand({
          TableName: highscoreTableName, Item: message.item
        }));
        val = { statusCode: 200, body: 'highscoredatasaved' };
      } catch (e) {
        const errString = 'error saving highscore data for '
          + `${JSON.stringify(message.item)} ${JSON.stringify(e)}`;
        console.error(errString);
        val = { statusCode: 500, body: e };
      }
      return val;
    case 'analytics':
      val = await sendMessages(message.analytics);
    case 'progress':
      await updateProgress(message.progress);
      val = { statusCode: 200, body: 'messages sent' };
      return val;
    default:
      message.domainName = event.requestContext.domainName;
      message.stage = event.requestContext.stage;
      message.action = 'liveadmin';
      const sendChatVal = await SendChat(message);
      val = { statusCode: 200, body: 'messages sent' };
      if (message.subaction === 'reset') {
        await eb.send(new PutEventsCommand({
          Entries: [{
            DetailType: "Websockets.game_end"  ,
            Source: 'sts',
            Detail: JSON.stringify({gameId: message.gameId, playerName: message.playerName}),
            EventBusName: eventBusName
          }]
        }))
      }
      return val;
  }
};
