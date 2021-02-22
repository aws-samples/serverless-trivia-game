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
// Function: playerwallet_add:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { sns: '2010-03-31' };
AWS.config.update = ({ region: process.env.REGION });

const sns = new AWS.SNS();
const playerWalletTopic = process.env.PLAYER_WALLET_TOPIC;

async function addGameBucks(playerName) {
  const amount = 200;
  const action = 'add';
  try {
    await sns.publish({
      TopicArn: playerWalletTopic,
      Message: 'Player requesting money',
      MessageAttributes: {
        playerId: { DataType: 'String', StringValue: playerName },
        amount: { DataType: 'Number', StringValue: amount.toString(10) },
        action: { DataType: 'String', StringValue: action },
      },
    }).promise();
    return { statusCode: 200, body: 'Funds have been requested' };
  } catch (e) {
    console.error(`Error when sending Player Wallet Message ${e.stack}`);
    return { statusCode: 500, body: 'Could not add funds' };
  }
}

exports.handler = async (event) => {
  const playerName = event.pathParameters.playerId;
  const msg = await addGameBucks(playerName);
  return msg;
};
