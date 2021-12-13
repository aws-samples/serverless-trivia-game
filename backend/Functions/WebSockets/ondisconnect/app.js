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
// Function: ondisconnect:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const tablename = process.env.GAME_PLAYERS_TABLE_NAME;

async function delete_records(records) {
  records.Items.forEach(record => {
    let deleteParams = {
      TableName: tablename,
      Key: {
        pk: record.pk,
        sk: record.sk
        }
      };
    try {
      ddb.delete(deleteParams).promise();
    } catch (err) {
      console.error(`could not delete record due to ${err}`);
    }
  });
}

exports.handler = async (event) => {
  const query = { TableName: tablename, IndexName: 'gsi-connectionId',
    KeyConditionExpression: 'connectionId = :connId',
    ExpressionAttributeValues: {
      ':connId': event.requestContext.connectionId
    }};
  
  const results = await ddb.query(query).promise();
  
  return delete_records(results);
};
