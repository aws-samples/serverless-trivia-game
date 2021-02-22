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

const gamesTablename = process.env.GAMES_TABLE_NAME;

async function activateGame(gameInfo) {
  // store the game to be hosted
  try {
    await ddb.put({
      TableName: gamesTablename,
      Item: gameInfo,
    }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ gameId: gameInfo.gameId, status: 'Now available to play' }),
    };
  } catch (e) {
    console.error(`Error finding game ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'could not find game' }) };
  }
}

exports.handler = async (event) => {
  const gameInfo = JSON.parse(event.body);
  const retVal = await activateGame(gameInfo);
  return retVal;
};
