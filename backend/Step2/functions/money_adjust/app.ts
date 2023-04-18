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
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const playerWalletTableName: string = process.env.PLAYER_WALLET_TABLE_NAME!;
const playerWalletIdempotencyTableName: string = process.env.PLAYER_WALLET_IDEMPOTENCY_TABLE_NAME!;
const region: string = process.env.REGION!;
const ttlSetting = 300000;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb, {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

const clearIdempotency = async(msgId: string) => {
  try {
    await ddbDocClient.send(new DeleteCommand({
        TableName: playerWalletIdempotencyTableName,
        Key: { "msgId": msgId }
    }));
  } catch (error) {
    console.error(`could not clear idempotency record on error`)
    return;
  }
}

const idempotencyCheck =  async(msgId: string) => {
    const ttl: number = Math.floor(Date.now() / 1000) + ttlSetting;
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: playerWalletIdempotencyTableName,
        Item: { msgId: msgId, expiration: ttl },
        ConditionExpression: "attribute_not_exists(messageId)"
      }))
      return false;
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        return true;
      }
      throw error;
    }
}


const addToWallet = async(msgId: string, playerName: string, amount: number, action: string) => {
  let result;
  let item;
  if(idempotencyCheck(msgId)) {
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
      clearIdempotency(msgId);
      return { statusCode: 500, body: 'Error adding to player wallet' };
    }
  }
}

export const handler = async (event: SNSEvent) => {
  let message: SNSMessage = event.Records[0].Sns;
  const msgId = message.MessageId;
  const playerName: string = message.MessageAttributes.playerId?.Value!;
  const amount: number = +message.MessageAttributes.amount?.Value;
  const action: string = message.MessageAttributes.action?.Value!;
  return await addToWallet(msgId, playerName, amount, action);
};
