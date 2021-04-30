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
// Function: game_join:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

//const AWS = require('aws-sdk');
const redis = require('redis');

//AWS.config.apiVersions = { iot: '2015-05-28' };
//AWS.config.update = ({ region: process.env.REGION });

const redisEndpoint = process.env.REDIS_ENDPOINT;
const redisPort = process.env.REDIS_PORT;
//const endpoint = process.env.IOT_ENDPOINT;

const redisOptions = {
  host: redisEndpoint,
  port: redisPort,
};

const redisClient = redis.createClient(redisOptions);
/*
const iotdata = new AWS.IotData({ endpoint });
*/
async function addPlayerToLeaderboard(key, gameInfo) {
  const promise = new Promise((resolve, reject) => {
    const localkey = `${key}:scoreboard`;
    const playerName = gameInfo.respondingPlayerName;
    try {
      redisClient.zadd(localkey, "NX", parseFloat(0), playerName);
      resolve('done');
    } catch(err) {
      console.error(JSON.stringify(err));
      reject(err);
    }
  });
  return promise;
}
/*
async function sendIoTMessage(params) {
  try {
    await iotdata.publish(params).promise();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
*/
/*
async function sendNotification(key, gameInfo) {
  const payload = { playerJoined: gameInfo.respondingPlayerName };
  const params = {
    topic: `games/${key}/joined/${gameInfo.respondingPlayerName}`,
    payload: JSON.stringify(payload),
    qos: 0,
  };
  await sendIoTMessage(params);
}
*/
async function handleJoinedGame(gameInfo) {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  await addPlayerToLeaderboard(key, gameInfo);
  //await sendNotification(key, gameInfo);
  return { statusCode: 200, body: 'added' };
}

exports.handler = async (event) => {
  return handleJoinedGame(event);
};
