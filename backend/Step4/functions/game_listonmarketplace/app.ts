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
// Function: game_listonmarketplace:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { cors } from "@lambda-middleware/cors";

const marketplaceTableName: string = process.env.MARKETPLACE_TABLE_NAME!;
const playerInventoryTable: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 
const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

const ListOnMarketplace = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  //(playerId, gameId, body.amount);
  const playerId = event.pathParameters?.playerId;
  const gameId = event.pathParameters?.gameId;
  if(!playerId || !gameId) {
    return { statusCode: 400, body: 'game or player data not found' }
  }
  let body: any;
  try {
    if(event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    console.error(`not JSON ${JSON.stringify(e)}`);
    return { statusCode: 500, body: JSON.stringify({ reason: 'invalid data sent' }) };
  }

  try {
    const getGame = await ddbDocClient.send(new GetCommand({ 
      TableName: playerInventoryTable, 
      Key: { pk: playerId, sk: gameId }
    }))
    if (getGame.Item) {
      if (getGame.Item.quizMode === 'Run Anytime') {
        console.error(`tried to sell single player game ${JSON.stringify(getGame.Item)}`);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'cannot sell single player game' }),
        };
      }
      if (getGame.Item.usage !== 'unlimited') {
        console.error(`tried to sell a purchased game ${JSON.stringify(getGame.Item)}`);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'cannot sell purchased game' }),
        };
      }
      const { Item } = getGame;
      Item.usage = 1;
      Item.amount = body.amount;
      //Updates for new Inventory Game table
      Item.gameId = Item.sk;
      Item.playerName = Item.pk;
      delete(Item.pk);
      delete(Item.sk);
      //End updates for new Inventory Game table
      const result = await ddbDocClient.send(new PutCommand({ 
        TableName: marketplaceTableName, Item 
      }))
      return { statusCode: 200, body: JSON.stringify({ gameid: Item.gameId }) };
    }
    console.error(`Could not find game in inventory ${playerId} - ${gameId}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'could not find game in inventory' }) };
  } catch (e) {
    console.error(`Could not save game to marketplace ${JSON.stringify(e)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not save game to marketplace' }),
    };
  }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await ListOnMarketplace(event);
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