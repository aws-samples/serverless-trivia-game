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
// Function: score_put:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { SNSEvent, SNSMessage } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const scoresTableName = process.env.SCORES_TABLE_NAME!;
const region = process.env.REGION!;

const marshallOptions = {
  convertEmptyValues: false, // false, by default.
  removeUndefinedValues: true, // false, by default.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb, translateConfig);

const updateScoreboard = async(gameId: string, quizName: string, playerName: string, score: number) => {
  try {
    const scoreData = await ddbDocClient.send( new GetCommand({
      TableName: scoresTableName,
      Key: { gameId, playerName }, 
    }));
    if (!scoreData.Item) {
      // store the record only if player has not taken the quiz
      await ddbDocClient.send(new PutCommand({
        TableName: scoresTableName,
        Item: { gameId, quizName, playerName, score },
      }));
      return { statusCode: 200, body: 'score saved' };
    } else {
      return { statusCode: 200, body: 'score existed' };
    }
  } catch (e) {
    console.error(`could not get score info ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Error getting score' };
  }
}

export const handler = async (event: SNSEvent) => {
  console.log(`${JSON.stringify(event)}`);
  let message: SNSMessage = event.Records[0].Sns;
  const msg: any = JSON.parse(message.Message);
  return await updateScoreboard(msg?.gameId, msg?.quizName, msg?.playerid,
    msg?.score);
};
