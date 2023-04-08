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
// Function: money_adjust:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { SNSEvent, SNSMessage } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const playerWalletTableName: string = process.env.PLAYER_WALLET_TABLE_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

const addToWallet = async(playerName: string, amount: number, action: string) => {
  let result;
  let item;
  try {
    result = await ddbDocClient.send(new GetCommand(
      { TableName: playerWalletTableName,
      Key: { playerName }}
      ));
    if (result.Item) {
      item = result.Item;
      if (action === 'subtract') {
        amount *= -1;
      }
      item.amount += amount;
      result = await ddb.send(new PutCommand({ TableName: playerWalletTableName, Item: item }));
      return { statusCode: 200, body: JSON.stringify(result) };
    } else {
      item = { playerName, amount };
      result = await ddb.send(new PutCommand({ TableName: playerWalletTableName, Item: item }));
      return { statusCode: 200, body: JSON.stringify(result) };
    }
  } catch (e) {
    console.error(`Could not add to player wallet ${playerName} ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Error adding to player wallet' };
  }
}

export const handler = async (event: SNSEvent) => {
  let message: SNSMessage = event.Records[0].Sns;
  const playerName: string = message.MessageAttributes.playerId?.Value!;
  const amount: number = +message.MessageAttributes.amount?.Value;
  const action: string = message.MessageAttributes.action?.Value!;
  return await addToWallet(playerName, amount, action);
};
