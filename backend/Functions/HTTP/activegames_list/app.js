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
// Function: activegames_list:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const AmazonDaxClient = require('amazon-dax-client')
const { Unit } = require('aws-embedded-metrics');
const { logMetricEMF } = require('/opt/logger');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });


const playerInventoryTableName = process.env.PLAYER_INVENTORY_TABLE_NAME;
const daxEndpoint = process.env.DAX_ENDPOINT;

const dax = new AmazonDaxClient({endpoints: daxEndpoint, region: process.env.REGION});
const ddb = new AWS.DynamoDB.DocumentClient({service: dax });

async function getActiveGames(event) {
  if(event.rawQueryString === '') {
    return { statusCode: 200, body: 'No parameters provided' };
  }
  if(event['rawQueryString'].indexOf('host')!==-1) {
    const gameType = 'LIVE='+event['queryStringParameters']['host'];
    //perform the query on the GSI for the record and return it
    try {
      const parms = {TableName: playerInventoryTableName,
        IndexName: 'gsi-GameType',
        KeyConditionExpression: 'gameType = :gameType',
        ExpressionAttributeValues: {':gameType': gameType }
      };
      const result = await ddb.query(parms).promise();
      const games = result.Items;
      return { statusCode: 200, body: JSON.stringify(games) };
    } catch(e) {
      console.error(`error getting live game ${e}`);
      return { statusCode: 500, body: 'Could not retrieve game' };
    }
  }
  if(event['rawQueryString'].indexOf('category')!==-1) {
    const gameType = 'SINGLE='+event['queryStringParameters']['category'];
    //perform the query on the GSI for the record and return it
    try {
      const parms = {TableName: playerInventoryTableName,
        IndexName: 'gsi-GameType',
        KeyConditionExpression: 'gameType = :gameType',
        ExpressionAttributeValues: {':gameType': gameType }
      };
      const result = await ddb.query(parms).promise();
      const games = result.Items;
      return { statusCode: 200, body: JSON.stringify(games) };
    } catch(e) {
      console.error(`error getting live game ${e}`);
      return { statusCode: 500, body: 'Could not retrieve game' };
    }
  }
  //fallthrough
  return { statusCode: 200, body: 'Please include proper query parameters' };
}

exports.handler = async (event) => {
  const retVal = await getActiveGames(event);
  return retVal;
};