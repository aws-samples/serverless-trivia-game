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

// SPDX-License-Identifier: MIT-0
// Function: mygames_list:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE;

async function getMyGames(playerName) {
  // provide list of games for user back to UI
  // OwnerGames Index on
  // gameinfo.playerName
  const parms = {};
  parms.TableName = playerInventoryTableName;
  parms.KeyConditionExpression = '#key = :v1';
  parms.ExpressionAttributeValues = { ':v1': playerName };
  parms.ExpressionAttributeNames = { '#key': 'playerName' };
  parms.ProjectionExpression = 'gameId, quizName, quizDescription, '
    + 'questionType, quizMode, inventoryType';
  let results;
  try {
    results = await ddb.query(parms).promise();
  } catch (e) {
    console.error(`could not retrieve games ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Could not retrieve games' };
  }
  let result;
  if (Object.prototype.hasOwnProperty.call(results, 'Items')) {
    result = results.Items;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  }
  result = 'NoResults';
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

exports.handler = async (event) => {
  const { playerId } = event.pathParameters;
  const msg = await getMyGames(playerId);
  return msg;
};
