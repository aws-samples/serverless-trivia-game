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
// Function: playerprogression_put:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { SNSEvent, SNSMessage } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const playerProgressTable = process.env.PLAYER_PROGRESS_TABLE_NAME!;
const playerProgressIdemopotencyTable = process.env.PLAYER_PROGRESS_IDEMPOTENCY_TABLE_NAME!;
const region = process.env.REGION;
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
        TableName: playerProgressIdemopotencyTable,
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
        TableName: playerProgressIdemopotencyTable,
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

const getLevel = async(xp: number) => {
  const levels = [100, 250, 500, 800, 1100, 1500, 3000, 10000, 25000, 50000];
  for (let i = 0; i < levels.length; i += 1) {
    if (xp < levels[i]) {
      return i;
    }
  }
}

const updateXP = async(playerName: string, experience: number, wins: number) => {
  let current;
  if(!playerName || playerName === '') {
    return;
  }
  try {
    current = await ddbDocClient.send(new GetCommand({
      TableName: playerProgressTable,
      Key : { playerName: playerName },
    }));
    if(!current.Item) {
      // no item was retrieved - player has no current progress
      const level = await getLevel(experience);
      const result = await ddbDocClient.send(new PutCommand({ 
        TableName: playerProgressTable,
        Item: {
          playerName, experience, level, wins,
        },
      }));
    } else {
      const newxp = current.Item.experience + experience;
      const newwins = current.Item.wins + wins;
      const newlevel = await getLevel(newxp);
      await ddb.send(new UpdateCommand({
        TableName: playerProgressTable,
        Key: { playerName: playerName },
        ExpressionAttributeNames: { '#xp': 'experience', '#lvl': 'level', '#wins': 'wins' },
        ExpressionAttributeValues: {
          ':xp': newxp, ':lvl': newlevel, ':wins': newwins, ':curxp': current.Item.experience,
        },
        ConditionExpression: '#xp = :curxp',
        UpdateExpression: 'set #xp = :xp, #lvl = :lvl, #wins = :wins',
      }));
      return;
    }
  } catch (e) {
    console.error(`Error setting player progress ${JSON.stringify(e.stack)}`);
    return;
  }
}

export const handler = async (event: SNSEvent) => {
  const message: SNSMessage = event.Records[0].Sns;
  const msgId = message.MessageId;
  const msg = JSON.parse(message.Message);
  if (idempotencyCheck(msgId)) {
    await Promise.all([
      updateXP(msg.playerid, msg.experience, msg.wins),
      updateXP(msg.owner, msg.experience, 0),
    ])
      .catch((e) => {
        clearIdempotency(msgId);
        console.error(`Error logging ${e.stack}`)});
  }
};
