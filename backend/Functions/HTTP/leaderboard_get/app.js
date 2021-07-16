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
// Function: leaderboard_get:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const scoresTableName = process.env.SCOREBOARD_TABLE_NAME;
const playerTableName = process.env.PLAYER_TABLE_NAME;

async function getScoreboard(gameId, playerId) {
  let scoreboardData;
  const scoreboard = [];
  let includesPlayer = false;
  const queryparms = {
    TableName: scoresTableName,
    IndexName: 'GameScore',
    ExpressionAttributeValues: { ':v1': gameId, ':v2': -1 },
    ExpressionAttributeNames: { '#key': 'gameId', '#score': 'score' },
    KeyConditionExpression: '#key = :v1 AND #score > :v2',
    ProjectionExpression: 'gameId, quizName, playerName, score',
    Limit: 10,
    ScanIndexForward: false,
  };
  try {
    scoreboardData = await ddb.query(queryparms).promise();
  } catch (e) {
    console.error(`could not get leaderboard info ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Could not retrieve leaderboard' };
  }
  const leaders = scoreboardData.Count;
  for (let i = 0; i < leaders; i += 1) {
    const playerData = scoreboardData.Items[i];
    const thisScore = (Number(playerData.score) * 100).toFixed(2);
    scoreboard.push({
      Position: i + 1,
      playerName: playerData.playerName,
      Score: `${String(thisScore)}%`,
    });
    if (playerData.playerName === playerId) {
      includesPlayer = true;
    }
  }
  if (!includesPlayer && playerId !== '') {
    // list does not contain current player'
    const Key = { gameId, playerName: playerId };
    const playerResult = await ddb.get({
      TableName: scoresTableName,
      Key,
    }).promise();
    if (Object.prototype.hasOwnProperty.call(playerResult, 'Item')) {
      scoreboard.push({
        Position: 'unknown',
        playerName: playerResult.Item.playerName,
        Score: `${String(Number(playerResult.Item.score) * 100)}%`,
      });
    }
  }
  return scoreboard;
}

async function addPlayerThumbnail(scoreboard) {
  const scoreboardWithThumbnails = [];
  let playerProfilesMap;
  const playerNames = scoreboard.map((item) => ({ playerName: item.playerName }));
  const params = {
    RequestItems: {
      [playerTableName]: {
        Keys: playerNames,
        AttributesToGet: ['playerName', 'thumbnail'],
      },
    },
  };
  try {
    const playerProfiles = await ddb.batchGet(params).promise();
    playerProfilesMap = playerProfiles.Responses[playerTableName]
      /* eslint-disable no-param-reassign, no-return-assign, no-sequences */
      .reduce((map, obj) => (map[obj.playerName] = obj.thumbnail, map), {});
    for (let i = 0; i < scoreboard.length; i += 1) {
      scoreboardWithThumbnails.push({
        Position: scoreboard[i].Position,
        playerName: scoreboard[i].playerName,
        playerAvatar: playerProfilesMap[scoreboard[i].playerName],
        Score: scoreboard[i].Score,
      });
    }
    return scoreboardWithThumbnails;
  } catch (e) {
    console.error(`could not get player profile info ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: 'Could not retrieve leaderboard' };
  }
}

exports.handler = async (event) => {
  const { gameId } = event.pathParameters;
  let playerId = '';
  if (Object.prototype.hasOwnProperty.call(event, 'queryStringParameters')) {
    if (Object.prototype.hasOwnProperty.call(event.queryStringParameters, 'playerId')) {
      playerId = JSON.parse(event.queryStringParameters).playerId;
    }
  }
  const scoreboard = await getScoreboard(gameId, playerId);
  const scoreboardWithThumbnails = await addPlayerThumbnail(scoreboard);
  return { statusCode: 200, body: JSON.stringify(scoreboardWithThumbnails) };
};
