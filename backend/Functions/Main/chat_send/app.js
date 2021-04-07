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
// Function: send_chat:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const AWS = require('aws-sdk');

AWS.config.apiVersions = { iot: '2015-05-28' };

const endpoint = process.env.IOT_ENDPOINT;

const iotdata = new AWS.IotData({ endpoint });

async function sendIoTMessage(params) {
  try {
    await iotdata.publish(params).promise();
    return true;
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)}`);
    return false;
  }
}

async function sendChat(channel, message) {
  const params = {
    topic: `chat/${channel}`,
    payload: JSON.stringify({ message }),
    qos: 0,
  };
  await sendIoTMessage(params);
}

exports.handler = async (event) => {
  let message = {};
  message = event.Records[0];
  const msg = message.Sns.Message;
  const channel = message.Sns.Subject;
  const retVal = await sendChat(channel, msg);
  return retVal;
};
