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
// Function: playerprogression_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();

const playerProgressTable = process.env.PLAYER_PROGRESS_TABLE_NAME;

async function getLevel(xp) {
  const levels = [100, 250, 500, 800, 1100, 1500, 3000, 10000, 25000, 50000];
  for (let i = 0; i < levels.length; i += 1) {
    if (xp < levels[i]) {
      return i;
    }
  }
  return 0;
}

async function updateXP(playerName, experience, wins) {
  const Key = { playerName };
  let current;
  try {
    current = await ddb.get({
      TableName: playerProgressTable,
      Key,
    }).promise();
  } catch (e) {
    console.error(`Error getting player record ${JSON.stringify(e.stack)}`);
    console.error(`get${JSON.stringify(Key)}`);
  }
  let result;
  if (!Object.prototype.hasOwnProperty.call(current, 'Item')) {
    // no item was retrieved - player has no current progress
    const level = await getLevel(experience);
    const parms = {
      TableName: playerProgressTable,
      Item: {
        playerName, experience, level, wins,
      },
    };
    try {
      result = await ddb.put(parms).promise();
    } catch (e) {
      console.error(`error storing ${playerName} - ${experience.toString()}`);
      console.error(`${JSON.stringify(e.stack)}`);
    }
  } else {
    const newxp = current.Item.experience + experience;
    const newwins = current.Item.wins + wins;
    const newlevel = await getLevel(newxp);
    const updateParms = {
      TableName: playerProgressTable,
      Key: { playerName },
      ExpressionAttributeNames: { '#xp': 'experience', '#lvl': 'level', '#wins': 'wins' },
      ExpressionAttributeValues: {
        ':xp': newxp, ':lvl': newlevel, ':wins': newwins, ':curxp': current.Item.experience,
      },
      ConditionExpression: '#xp = :curxp',
      UpdateExpression: 'set #xp = :xp, #lvl = :lvl, #wins = :wins',
    };
    try {
      result = await ddb.update(updateParms).promise();
    } catch (e) {
      console.error(`error updating xp for ${playerName} - ${newxp.toString}`);
      console.error(`Error: ${JSON.stringify(e.stack)}`);
    }
  }
  return result;
}

exports.handler = async (event) => {
  const message = event.Records[0];
  const msg = JSON.parse(message.Sns.Message);
  await Promise.all([
    updateXP(msg.playerid, msg.experience, msg.wins),
    updateXP(msg.owner, msg.experience, 0),
  ])
    .catch((e) => {console.error(`Error logging ${e.stack}`)});
};
