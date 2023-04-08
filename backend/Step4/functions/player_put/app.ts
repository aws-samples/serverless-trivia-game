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
// Function: player_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
import { cors } from "@lambda-middleware/cors";

const playersTable: string = process.env.PLAYER_TABLE_NAME!
const region: string = process.env.REGION!;
const playerAvatarBucket: string = process.env.PLAYER_AVATAR_BUCKET!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: false,
};

const unmarshallOptions = {
  wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb, translateConfig);

const client = new S3Client({ region: region });
 
const savePlayer = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const playerId: string = event.pathParameters?.playerId!;
  let playerItem: any;
  if(event.body) {
    playerItem = JSON.parse(event.body);
  }
  if (playerItem && playerItem?.newavatar && playerItem?.newavatar !== '') {
    const fileExt: string = playerItem.newavatar.split('.').pop();
    const now: any = new Date();
    const filekey: string = `${playerId}/${now.toISOString()}/avatar.${fileExt}`;
    const putObjectOptions: PutObjectCommandInput = {
      Bucket: playerAvatarBucket,
      Key: filekey,
      ContentType: playerItem.fileType,
      Metadata: {
        playerId: playerId,
      },
    };
    console.log(`${JSON.stringify(putObjectOptions)}`)
    const command = new PutObjectCommand(putObjectOptions)
    const signedurl: string = await getSignedUrl(client, command, { expiresIn: 3600 });
    //const url: any = await getSignedUrl(playerId, playerItem);
    return { statusCode: 200, body: JSON.stringify({ signedurl: signedurl }) };
  }

  try {
    let expressionAttributeValues: any = {};
    let updateExpression: string = 'SET latestUpdate = :updateTime';
    expressionAttributeValues[":updateTime"] = Date.now();
    if(playerItem && playerItem.playerLocation) {
      updateExpression = updateExpression + ", playerLocation = :playerLocation";
      expressionAttributeValues[":playerLocation"] = playerItem.playerLocation;
    }
    if(playerItem && playerItem.realName) {
      updateExpression = updateExpression + ", realName = :realName";
      expressionAttributeValues[":realName"] = playerItem.realName;
    }
    const ddbResult = await ddbDocClient.send( new UpdateCommand({
      TableName: playersTable,
      Key: { playerName: playerId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    }));
    console.log(JSON.stringify(ddbResult));
    if (ddbResult.$metadata.httpStatusCode == 200) {
      return {
        statusCode: 200,
        body: `user updated successfully`}
    } else {
      return {
        statusCode: 200,
        body: `no updated attributes returned` };
    }
  } catch (e) {
    console.error(`error updating user ${JSON.stringify(e.stack)}`);
      return {
        statusCode: 500,
        body: `could not update player` };
    };
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await savePlayer(event);
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