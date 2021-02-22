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
// Function: money_adjust:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const playerWalletTableName = process.env.PLAYER_WALLET_TABLE_NAME;

async function addToWallet(playerName, amount, action) {
  let result;
  try {
    result = await ddb.get({
      TableName: playerWalletTableName,
      Key: { playerName },
    }).promise();
    let Item;
    if (Object.prototype.hasOwnProperty.call(result, 'Item')) {
      Item = result.Item;
      if (action === 'subtract') {
        amount *= -1;
      }
      Item.amount += amount;
      result = await ddb.put({ TableName: playerWalletTableName, Item }).promise();
      return { statusCode: 200, body: JSON.stringify(result) };
    }
    Item = { playerName, amount };
    result = await ddb.put({ TableName: playerWalletTableName, Item }).promise();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    console.error(`Could not add to player wallet ${playerName} ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Error adding to player wallet' };
  }
}

exports.handler = async (event) => {
  let message = {};
  message = event.Records[0];
  // const msg = JSON.parse(message.Sns.Message);
  const playerName = message.Sns.MessageAttributes.playerId.Value;
  const amount = parseInt(message.Sns.MessageAttributes.amount.Value, 10);
  const action = message.Sns.MessageAttributes.action.Value;
  const retVal = await addToWallet(playerName, amount, action);
  return retVal;
};
