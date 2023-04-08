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
// Function: game_get:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { cors } from "@lambda-middleware/cors";

const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

const getGame = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const sk: string = event.pathParameters?.gameId!;
  const pk: string = event.pathParameters?.playerId!;

  let gameHeader;
  try {
    gameHeader = await ddbDocClient.send( new GetCommand({
      TableName: playerInventoryTableName,
      Key: { pk: pk, sk: sk },
    }));
    console.log(`${JSON.stringify(gameHeader)}`)
  } catch (e) {
    console.error(`Error getting game ${pk}, ${sk}`);
    console.error(`could not get game header ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Could not find game' };
  }
  if(gameHeader.Item) {
    const game = {
      gameId: sk, questions: gameHeader.Item.questions,
      quizMode: gameHeader.Item.quizMode,
      questionType: gameHeader.Item.questionType,
      quizName: gameHeader.Item.quizName,
      quizDescription: gameHeader.Item.quizDescription,
      usage: gameHeader.Item.usage, pk: gameHeader.Item.pk,
      sk: gameHeader.Item.sk, category: gameHeader.Item.category,
      playerName: gameHeader.Item.playerName
    };
    console.log(`returning ${JSON.stringify(game)}`)
    return {statusCode: 200, body: JSON.stringify(game)};
  } else {
    return {statusCode: 200, body: 'Something went wrong getting the game'};
  }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await getGame(event);
};

export const handler = cors({
  allowCredentials: true,
  allowedOrigins: [
  ],
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