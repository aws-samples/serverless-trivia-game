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

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const playersTableName = process.env.PLAYERS_TABLE_NAME;

async function deleteItem(Table, Key) {
  const params = {
    TableName: Table,
    Key,
  };
  try {
    await ddb.delete(params).promise();
  } catch (e) {
    console.error(`Delete ERROR ${JSON.stringify(params)}`);
    console.error(`error: ${JSON.stringify(e)}`);
    return e;
  }
  return 1;
}

async function deleteRecords(gameId, playerName) {
  // delete records here if on reset
  // need to grab regular index
  const recsToDeleteParms = {
    TableName: playersTableName,
    ProjectionExpression: 'pk, sk',
    KeyConditionExpression: '#f1 = :v1',
    ExpressionAttributeValues: { ':v1': gameId + "#" + playerName },
    ExpressionAttributeNames: { '#f1': 'pk' },
  };
  try {
    const deleteData = await ddb.query(recsToDeleteParms).promise();
    for (let i = 0; i < deleteData.Count; i += 1) {
      const parms = { pk: deleteData.Items[i].pk, sk: deleteData.Items[i].sk };
      await deleteItem(playersTableName, parms);
    }
    return { statusCode: 200, body: 'old data deleted'};
  } catch (e) {
    console.error(`error with getting delete parms ${JSON.stringify(recsToDeleteParms)}`);
    console.error(`response ${JSON.stringify(e)}`);
    return { statusCode: 500, body: e.stack };
  }
}

exports.handler = async (event) => {
    const {playerName} = event.detail;
    const {gameId} = event.detail;
    return deleteRecords(gameId, playerName);
};