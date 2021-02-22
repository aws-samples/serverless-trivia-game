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
// Function: game_start:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const redis = require('redis');
AWS.config.apiVersions = { iot: '2015-05-28' };
AWS.config.update = ({ region: process.env.REGION });

const redisEndpoint = process.env.REDIS_ENDPOINT;
const redisPort = process.env.REDIS_PORT;
const endpoint = process.env.IOT_ENDPOINT;

const redisOptions = {
  host: redisEndpoint,
  port: redisPort,
};

const redisClient = redis.createClient(redisOptions);

const iotdata = new AWS.IotData({ endpoint });

const kinesis = new AWS.Kinesis();

async function sendIoTMessage(params) {
  try {
    await iotdata.publish(params).promise();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function getScoreboard(key) {
  const promise = new Promise((resolve, reject) => {
    redisClient.zrevrange(`${key}:scoreboard`, 0, 20, 'withscores', (err, value) => {
      if (err) {
        console.error(JSON.stringify(err));
        reject(err);
      }
      const data = [];
      value.map((result, index) => {
        if (index % 2 === 0) {
          data.push(value[index] = { playerName: value[index], score: value[index + 1] });
        }
      });
      resolve(data);
    });
  });
  return promise;
}

async function sendScoreboard(key) {
    const scoreboard = await getScoreboard(key);
    const params = {
      topic: `games/${key}/scoreboard`,
      payload: JSON.stringify(scoreboard),
      qos: 0,
    };
    await sendIoTMessage(params);
}

async function startGame(gameInfo) {
    const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
    await sendScoreboard(key);
    return { statusCode: 200, body: JSON.stringify({ status: 'game started' }) };
}

exports.handler = async function (event) {
  return startGame(event);
};
