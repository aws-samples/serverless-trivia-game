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
// Function: game_cache:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { IoTDataPlaneClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-iot-data-plane';
import { SNSClient, PublishCommand as SNSPublishCommand} from "@aws-sdk/client-sns";
import { RedisClientOptions, createClient } from "redis";

const redisEndpoint: string = process.env.REDIS_ENDPOINT!;
const redisPort: string = process.env.REDIS_PORT!;
const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const chatTopicArn: string = process.env.CHAT_TOPIC_ARN!;
const eventBusName: string = process.env.EVENT_BUS_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const sns = new SNSClient({ region: region});
const eb = new EventBridgeClient({ region: region});
const iotdata = new IoTDataPlaneClient({ region: region });

const redisOptions: RedisClientOptions = { socket: { host: redisEndpoint, port: +redisPort}}
const redisClient = createClient(redisOptions);
let connected: boolean = false;

const sendHostGameMessage = async(gameInfo: any): Promise<any> => {
  try {
    await sns.send(new SNSPublishCommand({
      TopicArn: chatTopicArn,
      Message: `${gameInfo.playerName} says "Hosting game: ${gameInfo.quizName}"`,
      Subject: 'globalchat'
    }))
    return { statusCode: 200, body: "successful" };
  } catch (e) {
    console.error(`error sending sns message ${JSON.stringify(e)}`);
    return { statusCode: 500, body: "could not send sns messaage" };
  }
}

const addToActiveGames = async(Item: any) => {
  try {
    await eb.send(new PutEventsCommand({ Entries: [{
      DetailType: "IoT.game_host"  ,
      Source: 'sts',
      Detail: JSON.stringify({
        gameId: Item.gameId, host: Item.playerName, 
        gameType: `LIVE=${Item.playerName}`, starttime: Item.starttime}),
      EventBusName: eventBusName
    }]}));
    return;
  } catch(e) {
    console.error(`could not set game to active ${e}`);
    return;
  }
}

const cacheQuestions = async(gameDetails: any) => {
  const key: string = `${gameDetails.gameId}:${gameDetails.playerName}`;
  
  let resp = await redisClient.hSet(key, 'gameCache', JSON.stringify(gameDetails));
  resp = await redisClient.expire(key, 3600);
  resp = await redisClient.set(`${key}:currentQuestion`, 0);
  resp = await redisClient.expire(`${key}:currentQuestion`, 3600);
  gameDetails.questionList.forEach(async(question:any) => {
    resp = await redisClient.hSet(key, `question${question.questionNumber.toString()}`, JSON.stringify(question));
  });
}

const getQuestionsFromDatabase = async(gameInfo: any): Promise<any> => {
  try {
    const quizHeader = await ddbDocClient.send(new GetCommand({
      TableName: playerInventoryTableName,
      Key: {sk: gameInfo.gameId, pk: gameInfo.playerName}  
    }));
    let gameReturn: any = gameInfo;
    gameReturn.questionList = quizHeader.Item.questions;
    console.log(`saving to cache`);
    await cacheQuestions(gameReturn);
    return gameReturn;
  } catch (e) {
    console.error(`could not get questions: ${JSON.stringify(e)}`);
    return {};
  }
}

const getQuestionsFromCache = async(gameInfo: any): Promise<any> => {
  try {
    const value = await redisClient.hGetAll(`${gameInfo.gameId}:${gameInfo.playerName}`)
    console.log(`${JSON.stringify(value)}`);
    //const value = await redisClient.hgetall();
    if (value && value.gameCache) {
      let result: any = value.gameCache;
      result.currentQuestionNumber = +value.currentQuestion;
      return result;
    } else {
      return;
    }
  } catch (e) {
    console.error(`error on return from cache for getQuestionsFromCache ${e}`);
    return {};
  }
}

const sendIoTMessage = async(params: PublishCommandInput): Promise<boolean> => {
  try {
    await iotdata.send(new PublishCommand(params));
    return true;
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)} - ${JSON.stringify(params)}`);
    return false;
  }
}

const publishQuestionList = async(gameInfo: any): Promise<boolean> => {
  const params: PublishCommandInput = {
    topic: `games/${gameInfo.gameId}:${gameInfo.playerName}/questionlist`,
    payload: new TextEncoder().encode(JSON.stringify(gameInfo)),
    qos: 0,
  };
  return await sendIoTMessage(params);
}

async function getQuestionList(gameInfo: any) {
  const questionList = await getQuestionsFromCache(gameInfo);
  if(questionList) {
    return questionList;
  } else {
    const gameDetails = await getQuestionsFromDatabase(gameInfo);
    return gameDetails;
  }
}

const getQuestionNumber = async(gameInfo: any): Promise<number> => {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  try {
    const value: string = await redisClient.get(`${key}:currentQuestion`)
    if (value) {
      return +value;
    } else {
      return -1;
    }
  } catch(e) {
    console.error(`error on return from cache for getQuestionNumber ${e}`);
    return 0;
  }
}

async function handleProcess(gameInfo: any): Promise<any> {
  delete gameInfo.subaction;
  await addToActiveGames(gameInfo);
  const gameDetails: any = await getQuestionList(gameInfo);
  const questionNumber: number = await getQuestionNumber(gameInfo);
  gameDetails.currentQuestionNumber = questionNumber;
  await publishQuestionList(gameDetails);
  await sendHostGameMessage(gameInfo);
  return { statusCode: 200, body: 'game set to be run' };
}

export const handler = async (event: any) => {
  console.log(`${JSON.stringify(event)}`)
  if(!connected) {
    await redisClient.connect();
    connected = true;
  }
  return handleProcess(event);
};
