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
// Function: purchasedgame_putkinesis:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

const kinesis = new AWS.Kinesis({ apiVersion: '2013-12-02' });

AWS.config.update = ({ region: process.env.REGION });

const { PURCHASE_STREAM } = process.env;

function dateString() {
  const date = new Date();
  const dateStr = `${(`00${date.getMonth() + 1}`).slice(-2)}/${
    (`00${date.getDate()}`).slice(-2)}/${
    date.getFullYear()} ${
    (`00${date.getHours()}`).slice(-2)}:${
    (`00${date.getMinutes()}`).slice(-2)}:${
    (`00${date.getSeconds()}`).slice(-2)}`;

  return dateStr;
}

async function putRecordToKinesis(event) {
  const record = JSON.stringify({
    playerName: event.playerId,
    amount: event.gameAmount,
    dateOfPurchase: dateString(),
  });

  kinesis.putRecord({
    Data: record,
    PartitionKey: 'purchase001',
    StreamName: PURCHASE_STREAM,
  }, (err, data) => {
    if (err) {
      console.error(JSON.stringify(err));
      return { statusCode: 500, message: JSON.stringify(err) };
    }
    return { statusCode: 200, message: `Record sent to Kinesis ${JSON.stringify(data)}` };
  });
}

exports.handler = async (event) => {
  await putRecordToKinesis(event);
};
