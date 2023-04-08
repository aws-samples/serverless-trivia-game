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
// Function: game_activate:app.js
// Only used for non-live games

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { cors } from "@lambda-middleware/cors";

const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 

const removeLiveGame = async (sk: string, pk: string) => {
  try {
    await ddbDocClient.send( new UpdateCommand({
        TableName: playerInventoryTableName,
        Key: {pk: pk, sk: sk},
        UpdateExpression: 'REMOVE gameType, starttime, hostName',
      }));
      return true
  } catch(e) {
    console.error(`error removing hosted game ${JSON.stringify(e)}`);
    return false
  }
}

const removeLiveForPlayer = async (gameInfo: any) => {
  try {
    const otherLiveGames = await ddbDocClient.send(new QueryCommand({
      TableName: playerInventoryTableName, IndexName: 'gsi-GameType',
      KeyConditionExpression:'gameType=:gameType',
      ExpressionAttributeValues:{':gameType':'LIVE='+gameInfo.playerName}
      }))
    if(otherLiveGames.Items && otherLiveGames.Count) {
      for(var i: number=0;i<+otherLiveGames.Count;i++) {
          await removeLiveGame(otherLiveGames.Items[i].pk, otherLiveGames.Items[i].sk);
      }
    }
  } catch(e) {
    console.error(`error querying for live games ${e}`);
    return false;
  }
}

const activateGame = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // store the game to be hosted
  // this is only for single player games
  if(event.body) {
    const gameInfo = JSON.parse(event.body);
    await removeLiveForPlayer(gameInfo);
    try {
      await ddbDocClient.send(new UpdateCommand({
        TableName: playerInventoryTableName,
        Key: {pk: gameInfo.playerName,sk: gameInfo.gameId },
        UpdateExpression: 'SET gameType=:type, starttime=:start, hostName=:host',
        ExpressionAttributeValues: {
          ':type': 'SINGLE=' + gameInfo.category,
          ':start': gameInfo.starttime,
          ':host': gameInfo.playerName
        }
      }));
      return {
        statusCode: 200,
        body: JSON.stringify({ gameId: gameInfo.gameId, status: 'Now available to play' }),
      };
    } catch (e) {
      console.error(`Error updating game ${JSON.stringify(e.stack)}`);
      return { statusCode: 500, body: JSON.stringify({ error: 'could not find game' }) };
    }
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'no details provided' }) };
  }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await activateGame(event);
};

export const handler = cors({
  allowCredentials: true,
  allowedOrigins: mainCorsDomainArray,
  allowedMethods: [
    'OPTIONS',
    'HEAD',
    'GET',
  ],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
  ]
})(originLambdaHandler)