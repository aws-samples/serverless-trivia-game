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
// Function: game_play:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const { Unit } = require('aws-embedded-metrics');
const { logMetricEMF } = require('/opt/logger');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const questionsTableName = process.env.QUESTIONS_TABLE_NAME;
const gamesTableName = process.env.PLAYER_INVENTORY_TABLE_NAME;

async function joinGame(sk, pk) {
  const Key = { pk, sk };
  let activeGameResponse;
  try {
    activeGameResponse = await ddb.get({
      TableName: gamesTableName,
      Key,
    }).promise();
    if (!Object.prototype.hasOwnProperty.call(activeGameResponse, 'Item')) {
      console.error(`Game not found ${JSON.stringify(activeGameResponse)}`);
      console.error(`Key Data ${JSON.stringify(Key)}`);
      return { statusCode: 500, body: JSON.stringify({ data: 'Looks like an invalid game' }) };
    }
  } catch (e) {
    console.error(`Error getting game ${JSON.stringify(e.stack)}`);
    console.error(`Key Data ${JSON.stringify(Key)}`);
    return { statusCode: 500, body: 'Error occurred retrieving game' };
  }

  // now to query the questions table and build the response object
  const pe = 'gameId, questionNumber, question, answerA,'
    + 'answerB, answerC, answerD, questionURI';
  const queryparms = {
    TableName: questionsTableName,
    ExpressionAttributeValues: { ':v1': sk },
    KeyConditionExpression: 'gameId = :v1',
    ProjectionExpression: pe,
  };
  const questionlist = activeGameResponse.Item;
  delete questionlist.starttime;

  try {
    const questions = await ddb.query(queryparms).promise();
    questionlist.questions = questions.Items;
    await logMetricEMF('GamesJoined', Unit.Count, 1,
      { service: 'game_play', operation: 'joinGame' });
    return { statusCode: 200, body: JSON.stringify(questionlist) };
  } catch (e) {
    await logMetricEMF('GamesJoinedFailed', Unit.Count, 1,
      { service: 'game_play', operation: 'joinGame' });
    console.error(`Invalid Game ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: JSON.stringify({ message: 'Looks like an invalid game' }) };
  }
}

exports.handler = async (event) => {
  const { gameId } = event.pathParameters;
  const { playerId } = event.pathParameters;
  const msg = await joinGame(gameId, playerId);
  return msg;
};
