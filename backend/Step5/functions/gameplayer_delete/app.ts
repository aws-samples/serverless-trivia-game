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

// Function: gameplayer_delete:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-case-declarations: "error" */
//import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const playersTableName: string = process.env.PLAYERS_TABLE_NAME!;
const playerInventoryTable: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

const deleteItem = async(TableName: string, Key: any) => {
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName,
      Key
    }));
    return 1;
  } catch (e) {
    console.error(`Delete ERROR`);
    console.error(`error: ${JSON.stringify(e)}`);
    return e;
  }
}

const deletePlayerRecords =  async(gameId: string, playerName: string) => {
  // delete records here if on reset
  // need to grab regular index
  try {
    const deleteData = await ddbDocClient.send(new QueryCommand({
      TableName: playersTableName,
      ProjectionExpression: 'pk, sk',
      KeyConditionExpression: '#f1 = :v1',
      ExpressionAttributeValues: { ':v1': gameId + "#" + playerName },
      ExpressionAttributeNames: { '#f1': 'pk' },
    }))
    if (deleteData.Count) {
      for (let i = 0; i < deleteData.Count; i += 1) {
        if(deleteData.Items && deleteData.Items[i].pk && deleteData.Items[i].sk) {
          const parms = { pk: deleteData.Items[i].pk, sk: deleteData.Items[i].sk };
          await deleteItem(playersTableName, parms);
        }
      }
    }
    return { statusCode: 200, body: 'old data deleted'};
  } catch (e) {
    console.error(`error with getting delete parms`);
    console.error(`response ${JSON.stringify(e)}`);
    return { statusCode: 500, body: e.stack };
  }
}

const updatePlayerInventory = async(gameId: string, playerName: string) => {
  try {
    const deleteFields = await ddbDocClient.send(new UpdateCommand({
      TableName: playerInventoryTable,
      Key: { pk: playerName, sk: gameId },
      UpdateExpression: "Remove gameType, hostName"
    }))
    return { statusCode: 200, body: 'playerInventoryCleared' }
  } catch(e) {
    console.error(`error with deleting fields in playerInventory`);
    console.error(`response ${JSON.stringify(e)}`);
    return { statusCode: 500, body: e.stack };
  }
}

export const handler = async (event: any) => {
    console.log(`${JSON.stringify(event)}`);
    const {playerName} = event.detail;
    const {gameId} = event.detail;
    await deletePlayerRecords(gameId, playerName);
    await updatePlayerInventory(gameId, playerName);
};