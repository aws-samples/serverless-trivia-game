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
// Function: game_end:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SNSClient, PublishCommand as SNSPublishCommand} from "@aws-sdk/client-sns";
import { RedisClientOptions, createClient } from "redis";

const scoreboardTable: string = process.env.LEADER_BOARD_TABLE_NAME!;
const playerProgressTopic: string = process.env.PLAYER_PROGRESS_TOPIC!;
const redisEndpoint: string = process.env.REDIS_ENDPOINT!;
const redisPort: string = process.env.REDIS_PORT!;
const eventBusName: string = process.env.EVENT_BUS_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const sns = new SNSClient({ region: region});
const eb = new EventBridgeClient({ region: region});

const redisOptions: RedisClientOptions = { socket: { host: redisEndpoint, port: +redisPort}}
const redisClient = createClient(redisOptions);
let connected: boolean = false;

const deleteCache = async(gameInfo: any): Promise<boolean> => {
  try {
    const values = await redisClient.keys(`${gameInfo.gameId}:${gameInfo.playerName}*`);
    for(let i = 0, len = values.length; i < len; i++) {
      await redisClient.del(values[i]);
    }
    return true;
  } catch(e) {
    console.error(`Could not get keys to delete: ${e.name}: ${e.message}`);
    return false;
  }
}

const deleteActiveGame = async(gameInfo: any): Promise<boolean> => {
  try {
    await eb.send(new PutEventsCommand({Entries: [{
        DetailType: "IoT.game_end"  ,
        Source: 'sts',
        Detail: JSON.stringify({gameId: gameInfo.gameId, playerName: gameInfo.playerName}),
        EventBusName: eventBusName
      }]}));
    return true;
  } catch(e) {
    console.error(`error sending to eb $${e.name}: ${e.message} ${JSON.stringify(event)}`);
    return false;
  }
}

const sendPlayerProgressMessage = async(progressMsg: string): Promise<boolean> => {
  try {
    await sns.send(new SNSPublishCommand({
      TopicArn: playerProgressTopic,
      Message: progressMsg,
    }))
    return true;
  } catch (e) {
    console.error(`Error when sending Player Progress Message ${e.name}: ${e.message}`);
    return false;
  }
}

const saveItem = async(TableName: string, Item: any) => {
  try {
    return await ddbDocClient.send(new PutCommand({ TableName, Item}));
  } catch (e) {
    console.error(`error persisting leaderboard for ${Item} ${e.name}: ${e.message}`);
    return;
  }
}

const persistLeaderboard = async(gameInfo: any): Promise<boolean> => {
  const owner = gameInfo.playerName;
  const TableName = scoreboardTable;
  try {
    const value = await redisClient.zRangeWithScores(`${gameInfo.gameId}:${gameInfo.playerName}:scoreboard`, 0, -1, { REV: true })
    const questions = await redisClient.hLen(`${gameInfo.gameId}:${gameInfo.playerName}`) - 1
    if(value.length > 0) {
      const highScore = value[0].score;
      value.map((result) => {
        let wins = 0;
        if (result.score === highScore) {
          wins = 1;
        }
        const Item = {
          gameId: gameInfo.gameId,
          playerName: result.value,
          quizName: gameInfo.quizName,
          score: (result.score / questions) * 100,
        };
        saveItem(TableName, Item);
        const progressmsg = JSON.stringify({
          playerid: result.value, experience: result.score, wins, owner,
        });
        sendPlayerProgressMessage(progressmsg);
      });
    }
    return true;
  } catch(e) {
    console.error(`error persisting scoreboard ${e.name}: ${e.message}`);
    return false;
  }
}

const endGame = async(gameInfo: any): Promise<any> => {
  await persistLeaderboard(gameInfo);
  const cacheDelete = await deleteCache(gameInfo);
  const dynamoDelete = await deleteActiveGame(gameInfo);
  if (cacheDelete && dynamoDelete) {
    return { statusCode: 200, body: 'game ended' };
  } else {
    if(!cacheDelete) {
      return { statusCode: 500, body: JSON.stringify(dynamoDelete) };
    } else {
      return { statusCode: 500, body: JSON.stringify(cacheDelete) };
    }
  }
}

export const handler = async (event: any) => {
  if(!connected) {
    await redisClient.connect();
    connected = true;
    return await endGame(event);  
  } else {
    return await endGame(event);
  }
  
};
