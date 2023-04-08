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
// Function: activegames_delete:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
/*const { Unit } = require('aws-embedded-metrics');
const { logMetricEMF } = require('/opt/logger');*/

const playerInventoryTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const region: string = process.env.REGION!;

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);

async function removeLiveGamePlayer(gameId: string, playerName: string) {
  if(!playerName || !gameId) {
    console.error(`missing key data ${playerName} - ${gameId}`);
    return;
  }
  try {
    await ddbDocClient.send( new UpdateCommand({TableName: playerInventoryTableName,
      Key: {pk: playerName, sk: gameId},
      UpdateExpression: 'REMOVE gameType, starttime, hostName'
    }));
  } catch(e) {
    console.error(`error removing hosted game ${JSON.stringify(e)}`);
  }
}

async function removeLiveGame(event: EventBridgeEvent<any, any>) {
  console.log(`removing live game data`)
  const playerName = event.detail?.playerName;
  const gameId = event.detail?.gameId;
  console.log(`${playerName} - ${gameId}`)
  if(!playerName || !gameId) {
    console.error(`missing key data ${playerName} - ${gameId}`);
    return;
  }
  try {
    await ddbDocClient.send( new UpdateCommand({TableName: playerInventoryTableName,
      Key: {pk: playerName, sk: gameId},
      UpdateExpression: 'REMOVE gameType, starttime, hostName'
    }));
  } catch(e) {
    console.error(`error removing hosted game ${JSON.stringify(e)}`);
  }
}

async function removeLiveForPlayer(event: EventBridgeEvent<any, any>) {
  const playerName = event.detail?.playerName;
  if(!playerName) {
    console.error(`missing key data ${playerName}`);
    return;
  }
  try {
    const otherLiveGames = await ddb.send(new QueryCommand({
      TableName: playerInventoryTableName, IndexName: 'gsi-GameType',
      KeyConditionExpression:'gameType=:gameType',
      ExpressionAttributeValues:{':gameType':'LIVE='+playerName}
    }));
    console.log(`${JSON.stringify(otherLiveGames)}`);
    if(otherLiveGames.Count && otherLiveGames.Items) {
      for(var i: number=0;i<+otherLiveGames.Count;i++) {
          await removeLiveGamePlayer(otherLiveGames.Items[i].pk, otherLiveGames.Items[i].sk);
      }
    } else {
      return true;
    }
  } catch(e) {
    console.error(`error querying for live games ${e}`);
    return false;
  }
}

export const handler = async (event: EventBridgeEvent<any, any>) => {
    console.log(`${JSON.stringify(event)}`);
    const gameId = event.detail?.gameId;
    if(gameId) {
      return await removeLiveGame(event);
    } else {
      return await removeLiveForPlayer(event);
    }
};