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
// Function: leaderboard_get:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { cors } from "@lambda-middleware/cors";

const scoresTableName: string = process.env.SCOREBOARD_TABLE_NAME!;
const domain: string = process.env.CLOUDFRONT_DOMAIN!;
const region: string = process.env.REGION!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb, 
  { marshallOptions: {
        removeUndefinedValues: true
  }});

const getScoreboard = async(gameId: string): Promise<APIGatewayProxyResult> => {

  let scoreboardData;
  let scoreboard = [];

  try {
    scoreboardData = await ddbDocClient.send( new QueryCommand({
      TableName: scoresTableName,
      IndexName: 'GameScore',
      ExpressionAttributeValues: { ':v1': gameId, ':v2': -1 },
      ExpressionAttributeNames: { '#key': 'gameId', '#score': 'score' },
      KeyConditionExpression: '#key = :v1 AND #score > :v2',
      ProjectionExpression: 'gameId, quizName, playerName, score',
      Limit: 10,
      ScanIndexForward: false,
    }))
    if(scoreboardData.Items && scoreboardData.Count) {
      const leaders: number = +scoreboardData.Count;
      for (let i = 0; i < leaders; i += 1) {
        const playerData = scoreboardData.Items[i];
        const thisScore = (Number(playerData.score)).toFixed(2);
        scoreboard.push({
          Position: i + 1,
          playerName: playerData.playerName,
          Score: `${String(thisScore)}%`,
          playerAvatar: `https://${domain}/${playerData.playerName}/current/thumb.jpg`
        });
      }
      return {statusCode: 200, body: JSON.stringify(scoreboard)};
    } else {
      return {statusCode: 200, body: JSON.stringify([]) };
    }
  } catch (e) {
    console.error(`could not get leaderboard info ${JSON.stringify(e)}`);
    return {statusCode: 500, body: JSON.stringify([]) };
  }
}

const compileScoreboard = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const gameId: string = event.pathParameters?.gameId!;
  let playerId: string = '';
  if(event.pathParameters?.playerId) {
    playerId = event.pathParameters?.playerId!;
  } 
  return await getScoreboard(gameId);
}


const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await compileScoreboard(event);
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