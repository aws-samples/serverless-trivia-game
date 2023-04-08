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
// Function: playerwallet_add:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { cors } from "@lambda-middleware/cors";

const playerWalletTopic: string = process.env.PLAYER_WALLET_TOPIC!;
const region: string = process.env.REGION!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 
const sns = new SNSClient({ region: region});

const addGameBucks =  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const playerName = event.pathParameters?.playerId;
  if(!playerName) {
    return { statusCode: 400, body: 'Playername not found' }
  }
  const amount = 200;
  const action = 'add';
  try {
    await sns.send(new PublishCommand({
      TopicArn: playerWalletTopic,
      Message: 'Player requesting money',
      MessageAttributes: {
        playerId: { DataType: 'String', StringValue: playerName },
        amount: { DataType: 'Number', StringValue: amount.toString(10) },
        action: { DataType: 'String', StringValue: action },
      },
    }));
    return { statusCode: 200, body: 'Funds have been requested' };
  } catch (e) {
    console.error(`Error when sending Player Wallet Message ${e.stack}`);
    return { statusCode: 500, body: 'Could not add funds' };
  }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await addGameBucks(event);
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
