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
// Function: game_activate:app.js
// Only used for non-live games

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE_NAME;

async function removeLiveGame(sk, pk) {
  try {
    const Key = {pk, sk};
    await ddb.update({
        TableName: playerInventoryTableName,
        Key,
        UpdateExpression: 'REMOVE gameType, starttime, hostName',
      }).promise();
  } catch(e) {
    console.error(`error removing hosted game ${JSON.stringify(e)}`);
  }
}

async function removeLiveForPlayer(playerName) {
  try {
    const parms = {TableName: playerInventoryTableName, IndexName: 'gsi-GameType',
      KeyConditionExpression:'gameType=:gameType',
      ExpressionAttributeValues:{':gameType':'LIVE='+playerName}
    };
    const otherLiveGames = await ddb.query(parms).promise();
    for(var i=0;i<otherLiveGames.Count;i++) {
        await removeLiveGame(otherLiveGames.Items[i].pk, otherLiveGames.Items[i].sk);
    }
  } catch(e) {
    console.error(`error querying for live games ${e}`);
    return false;
  }
}

async function activateGame(gameInfo) {
  // store the game to be hosted
  // this is only for single player games
  try {
    const gameType = 'SINGLE=' + gameInfo.category;
    const parms = {
      TableName: playerInventoryTableName,
      Key: {pk: gameInfo.playerName,sk: gameInfo.gameId },
      UpdateExpression: 'SET gameType=:type, starttime=:start, hostName=:host',
      ExpressionAttributeValues: {
        ':type': gameType,
        ':start': gameInfo.starttime,
        ':host': gameInfo.playerName
      }
    };
    await ddb.update(parms).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ gameId: gameInfo.gameId, status: 'Now available to play' }),
    };
  } catch (e) {
    console.error(`Error updating game ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'could not find game' }) };
  }
}

exports.handler = async (event) => {
  const gameInfo = JSON.parse(event.body);
  await removeLiveForPlayer(gameInfo.playerName);
  const retVal = await activateGame(gameInfo);
  return retVal;
};
