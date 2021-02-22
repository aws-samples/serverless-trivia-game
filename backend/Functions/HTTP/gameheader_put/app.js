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
// Function: gameheader_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["gameData"] }] */

const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE;

async function saveGameHeader(gameData) {
  gameData.gameId = uuidv4();
  try {
    await ddb.put({
      TableName: playerInventoryTableName,
      Item: gameData,
    }).promise();
    return { statusCode: 200, body: JSON.stringify({ gameid: gameData.gameId }) };
  } catch (e) {
    console.error(`Could not save game header ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: JSON.stringify({ message: 'Could not save game header' }) };
  }
}

exports.handler = async (event) => {
  let retVal;
  try {
    JSON.parse(event.body);
    const gameData = JSON.parse(event.body);
    retVal = await saveGameHeader(gameData);
  } catch (e) {
    console.error(`not JSON ${JSON.stringify(e.stack)}`);
  }

  return retVal;
};
