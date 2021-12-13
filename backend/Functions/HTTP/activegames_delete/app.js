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
// Function: activegames_delete:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const AmazonDaxClient = require('amazon-dax-client');
const { Unit } = require('aws-embedded-metrics');
const { logMetricEMF } = require('/opt/logger');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE_NAME;
const daxEndpoint = process.env.DAX_ENDPOINT;

const dax = new AmazonDaxClient({endpoints: daxEndpoint, region: process.env.REGION});
const ddb = new AWS.DynamoDB.DocumentClient({service: dax });

async function removeLiveGame(pk, sk) {
  try {
    const Key = {pk, sk};
    const parms = {TableName: playerInventoryTableName,
      Key,
      UpdateExpression: 'REMOVE gameType, starttime, hostName'};
    await ddb.update(parms).promise();
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

exports.handler = async (event) => {
    const {playerName} = event.detail;
    if(Object.prototype.hasOwnProperty.call(event, "gameId")) {
        const {gameId} = event.detail;
        return await removeLiveGame(gameId, playerName);
    } else {
        return await removeLiveForPlayer(playerName);
    }
};