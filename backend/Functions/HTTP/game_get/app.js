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
// Function: game_get:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const questionsTableName = process.env.GAMES_DETAIL_TABLE_NAME;
const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE_NAME;

async function getGame(sk, pk) {
  let gameInfo = {};
  const game = {};
  let gameHeader = {};
  const Key = { pk, sk };
  try {
    gameHeader = await ddb.get({
      TableName: playerInventoryTableName,
      Key,
    }).promise();
  } catch (e) {
    console.error(`Error getting game ${JSON.stringify(Key)}`);
    console.error(`could not get game header ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Could not find game' };
  }
  const queryparms = {
    TableName: questionsTableName,
    ExpressionAttributeValues: { ':v1': sk },
    ExpressionAttributeNames: { '#key': 'gameId' },
    KeyConditionExpression: '#key = :v1',
  };
  try {
    gameInfo = await ddb.query(queryparms).promise();
  } catch (e) {
    console.error(JSON.stringify(queryparms));
    console.error(`could not get game info ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Could not retrieve questions' };
  }
  game.gameId = sk;
  game.questions = gameInfo.Items;
  game.quizMode = gameHeader.Item.quizMode;
  game.questionType = gameHeader.Item.questionType;
  game.quizName = gameHeader.Item.quizName;
  game.quizDescription = gameHeader.Item.quizDescription;
  game.usage = gameHeader.Item.usage;
  return game;
}

exports.handler = async (event) => {
  const { gameId } = event.pathParameters;
  const { playerId } = event.pathParameters;
  const game = await getGame(gameId, playerId);
  return { statusCode: 200, body: JSON.stringify(game) };
};
