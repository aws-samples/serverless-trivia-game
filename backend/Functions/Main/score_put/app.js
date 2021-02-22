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
// Function: score_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
// const ddb = new AWS.DynamoDB();
const scoresTableName = process.env.SCORES_TABLE_NAME;

async function updateScoreboard(gameId, quizName, playerName, score) {
  const Key = { gameId, playerName };
  let scoreData;
  try {
    scoreData = await ddb.get({
      TableName: scoresTableName,
      Key,
    }).promise();
  } catch (e) {
    console.error(`could not get score info ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Error getting score' };
  }
  if (!(Object.prototype.hasOwnProperty.call(scoreData, 'Item'))) {
    // store the record only if player has not taken the quiz
    const Item = {
      gameId, quizName, playerName, score,
    };
    try {
      await ddb.put({
        TableName: scoresTableName,
        Item,
      }).promise();
    } catch (e) {
      console.error(`could not save score info ${JSON.stringify(e.stack)}`);
      return { statusCode: 500, body: e.stack };
    }
  }
  return { statusCode: 200, body: 'score saved' };
}

exports.handler = async (event) => {
  let message = {};
  message = event.Records[0];
  const msg = JSON.parse(message.Sns.Message);
  // TODO: track down all sendmessages to this to change for playerid
  const retVal = await updateScoreboard(msg.gameId, msg.quizName, msg.playerid,
    msg.score);
  return retVal;
};
