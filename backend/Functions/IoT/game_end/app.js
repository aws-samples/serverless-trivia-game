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
// Function: game_end:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const redis = require('redis');

AWS.config.apiVersions = { dynamodb: '2012-08-10', iot: '2015-05-28', sns: '2010-03-31' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const sns = new AWS.SNS();

const activeGamesTable = process.env.ACTIVE_GAMES_TABLE_NAME;
const scoreboardTable = process.env.LEADER_BOARD_TABLE_NAME;
const playerProgressTopic = process.env.PLAYER_PROGRESS_TOPIC;
const redisEndpoint = process.env.REDIS_ENDPOINT;
const redisPort = process.env.REDIS_PORT;

const redisOptions = {
  host: redisEndpoint,
  port: redisPort,
};

const redisClient = redis.createClient(redisOptions);

async function deleteCache(gameInfo) {
  const promise = new Promise((resolve) => {
    const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
    redisClient.keys(`${key}*`, (err, values) => {
      if (err) {
        console.error(`Could not get keys to delete ${JSON.stringify(err)}`);
        resolve(false);
      }
      for(let i = 0, len = values.length; i < len; i++) {
        redisClient.del(values[i]);
      }
      resolve(true);
    });
  });
  return promise;
}

async function deleteActiveGame(gameInfo) {
  const TableName = activeGamesTable;
  const Key = { gameId: gameInfo.gameId, playerName: gameInfo.playerName };
  try {
    await ddb.delete({ TableName, Key }).promise();
    return true;
  } catch (e) {
    console.error(`Error while deleting active game ${e}`);
    return false;
  }
}

async function sendPlayerProgressMessage(progressMsg) {
  try {
    const retval = await sns.publish({
      TopicArn: playerProgressTopic,
      Message: progressMsg,
    }).promise();
    return retval;
  } catch (e) {
    console.error(`Error when sending Player Progress Message ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: { error: 'Could not send player progress message' } };
  }
}

async function saveItem(TableName, Item) {
  try {
    await ddb.put({ TableName, Item }).promise();
  } catch (e) {
    console.error(`error persisting leaderboard for ${Item} ${e}`);
  }
}

async function persistLeaderboard(gameInfo) {
  const promise = new Promise((resolve) => {
    const key = `${gameInfo.gameId}:${gameInfo.playerName}:scoreboard`;
    const owner = gameInfo.playerName;
    const TableName = scoreboardTable;
    let highScore = 0;
    redisClient.zrevrange(key, 0, -1, 'withscores', (err, value) => {
      if (!err) {
        const map = value.reduce((map, k, i, res) => {
          if (i % 2 !== 0) {
            map[res[i - 1]] = Number(k);
          }
          return map;
        }, {});
        Object.keys(map).forEach((key) => {
          let wins = 0;
          if (highScore === 0) {
            highScore = map[key];
          }
          if (map[key] === highScore) {
            wins = 1;
          }
          const Item = {
            gameId: gameInfo.gameId,
            playerName: key,
            quizName: gameInfo.quizName,
            score: map[key],
          };
          saveItem(TableName, Item);
          const progressmsg = JSON.stringify({
            playerid: key, experience: map[key], wins, owner,
          });
          sendPlayerProgressMessage(progressmsg);
        });
      }
    });
    resolve(true);
  });
  return promise;
}

async function endGame(gameInfo) {
  await persistLeaderboard(gameInfo);
  const cacheDelete = await deleteCache(gameInfo);
  const dynamoDelete = await deleteActiveGame(gameInfo);
  if (cacheDelete && dynamoDelete) {
    return { statusCode: 200, body: 'game ended' };
  }
  return { statusCode: 500, body: JSON.stringify(cacheDelete, dynamoDelete) };
}

exports.handler = async (event) => {
  const retVal = await endGame(event);
  return retVal;
};
