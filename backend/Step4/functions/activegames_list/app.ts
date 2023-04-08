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
// Function: activegames_list:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { cors } from "@lambda-middleware/cors";

const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

const getActiveGames = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const host = event.queryStringParameters?.host;
    const category = event.queryStringParameters?.category;

    if(!host && !category) {
      return { statusCode: 200, body: 'Please include proper query parameters' }
    }
    
    if(host) {
      const gameType = 'LIVE='+host;
      console.log(`getting ${gameType}`);
      //perform the query on the GSI for the record and return it
      const parms = 
        {TableName: playerInventoryTableName,
          IndexName: 'gsi-GameType',
          KeyConditionExpression: 'gameType = :gameType',
          ExpressionAttributeValues: {':gameType': gameType }
        }
      try {
        const result = await ddbDocClient.send(new QueryCommand(parms));
        return { statusCode: 200, body: JSON.stringify(result.Items) }
      }
      catch(e) {
          console.error(`error getting live game ${e}`);
          return { statusCode: 500, body: 'Could not retrieve game' };
      }
    } else {
      const gameType = 'SINGLE='+category;
      console.log(`getting ${gameType}`);
      //perform the query on the GSI for the record and return it
      const parms = 
        {TableName: playerInventoryTableName,
          IndexName: 'gsi-GameType',
          KeyConditionExpression: 'gameType = :gameType',
          ExpressionAttributeValues: {':gameType': gameType }
        };
      try {
        const result = await ddbDocClient.send(new QueryCommand(parms));
        return { statusCode: 200, body: JSON.stringify(result.Items) }
      }
      catch(e) {
          console.error(`error getting live game ${e}`);
          return { statusCode: 500, body: 'Could not retrieve game' };
      }
    }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(`${JSON.stringify(event)}`);
    return await getActiveGames(event);
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