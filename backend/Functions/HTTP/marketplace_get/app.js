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
// Function: marketplace_get:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const { Unit } = require('aws-embedded-metrics');
const { logMetricEMF } = require('/opt/logger');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const marketplaceTableName = process.env.MARKETPLACE_TABLE_NAME;

async function getMarketplace() {
  const pe = 'gameId, quizName, playerName, quizMode, questionType, description, amount';
  try {
    const gameData = await ddb.scan({
      TableName: marketplaceTableName,
      ProjectionExpression: pe,
    }).promise();
    let games;
    if (Object.prototype.hasOwnProperty.call(gameData, 'Items')) {
      games = gameData.Items;
    } else {
      games = 'No current games listed on marketplace';
    }
    await logMetricEMF('MarketplaceListed', Unit.Count, 1,
      { service: 'marketplace_list', operation: 'listMarketplace' });
    return { statusCode: 200, body: JSON.stringify(games) };
  } catch (e) {
    console.error(`Could not retrieve marketplace ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, error: 'Could not retrieve marketplace' };
  }
}

exports.handler = async () => {
  const retVal = await getMarketplace();
  return retVal;
};
