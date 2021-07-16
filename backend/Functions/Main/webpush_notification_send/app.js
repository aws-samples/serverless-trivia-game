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
// Function: webpush_notification_send:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const webPush = require('web-push');
const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

const endpointTable = process.env.ENDPOINTS_TABLE_NAME;
const publicKeyPath = process.env.VAPID_PUBLIC_KEY_PATH;
const privateKeyPath = process.env.VAPID_PRIVATE_KEY_PATH;
const vapidDomain = process.env.DOMAIN;

const init = async () => new Promise((resolve) => {
  (async () => {
    try {
      const ssmParameters = await ssm.getParameters({
        Names: [
          publicKeyPath,
          privateKeyPath,
        ],
        WithDecryption: true,
      }).promise();
      const vapidKeys = Object.fromEntries(
        ssmParameters.Parameters.map((e) => [e.Name, e.Value]),
      );
      webPush.setVapidDetails(
        vapidDomain,
        vapidKeys[publicKeyPath],
        vapidKeys[privateKeyPath],
      );
      resolve(vapidKeys);
    } catch (e) {
      console.error(`Error reading parameters from SSM ${JSON.stringify(e.stack)}`);
      resolve({});
    }
  })();
});

const vapidKeys = init();

function send(subscriptions, payload, options, delay) {
  return new Promise((success) => {
    setTimeout(() => {
      Promise.all(subscriptions.map((subscription) => {
        try {
          const res = webPush.sendNotification(subscription, payload, options);
          return res;
        } catch (e) {
          console.error(e.message);
          throw e;
        }
      }))
        .then(() => {
          success({ statusCode: 200, body: JSON.stringify({}) });
        }).catch((error) => {
          console.error(error.message);
          success({ statusCode: 200, body: JSON.stringify({ error }) });
        });
    }, 1000 * parseInt(delay, 10));
  });
}

async function getSubscriptions(player) {
  let result;
  let msg = [];
  try {
    result = await ddb.query({
      TableName: endpointTable,
      KeyConditionExpression: 'topic = :hkey',
      ExpressionAttributeValues: {
        ':hkey': player,
      },
    }).promise();
    if (Object.prototype.hasOwnProperty.call(result, 'Items')) {
      msg = result.Items.map((Item) => ({
        endpoint: Item.endpoint,
        keys: {
          p256dh: Item.p256dh,
          auth: Item.auth,
        },
      }));
    }
  } catch (e) {
    console.error(`Error reading subscriptions ${JSON.stringify(e.stack)}`);
  }
  return msg;
}

exports.handler = async (event) => {
  await vapidKeys;

  const { playerName } = event.detail;
  const options = {
    TTL: 5,
  };
  const subscriptions = await getSubscriptions(playerName);
  try {
    const data = JSON.parse(event.detail.data);
    data.result = event.detail.result;
    const payload = {
      notification: {
        title: event.detail.topic,
        body: event.detail.message,
        data: JSON.stringify(data),
      },
    };
    await send(subscriptions, JSON.stringify(payload), options, 1);
  } catch (e) {
    console.error(`error sending web push notification ${JSON.stringify(e.stack)}`);
  }
};
