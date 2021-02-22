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

// Function: livegameplayer:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-param-reassign: ["error", { "props": false }] */

const AWS = require('aws-sdk');
const WSSend = require('/opt/index.js');

AWS.config.apiVersions = { dynamodb: '2012-08-10', sns: '2010-03-31' };
AWS.config.update = ({ region: process.env.REGION });

const gamesTableName = process.env.GAMES_TABLE_NAME;
const playersTableName = process.env.PLAYERS_TABLE_NAME;
const ddb = new AWS.DynamoDB.DocumentClient();

async function joingame(incoming, connectionId, domainName, stage) {
  const gameData = {};
  gameData.Key = { gameId: incoming.gameId, playerName: incoming.playerName };
  gameData.TableName = gamesTableName;
  let activeGameResponse;
  try {
    activeGameResponse = await ddb.get(gameData).promise();
    if (!('Item' in activeGameResponse)) {
      console.error(`invalid game info ${JSON.stringify(activeGameResponse)}`);
      return { statusCode: 500, body: JSON.stringify({ data: 'Invalid game' }) };
    }
  } catch (e) {
    console.error(`${JSON.stringify(gameData)}`);
    console.error(`error getting game data ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Error getting game data' };
  }

  const item = {};
  item.gameId = incoming.gameId;
  item.connectionId = connectionId;
  item.userName = incoming.username;
  item.role = 'PLAYER';
  const parms = {};
  parms.TableName = playersTableName;
  parms.Item = item;
  try {
    await ddb.put(parms, (err, data) => {
      if (err) {
        console.error(`Error ${JSON.stringify(err.stack)}`);
      } else {
        // may want to log some metrics here about dynamodb usage
      }
    }).promise;
    // send SNS message that the player has joined
    const message = {};
    message.action = 'liveplayer';
    message.domainName = domainName;
    message.stage = stage;
    message.playerName = incoming.username;
    message.subaction = 'joined';
    message.gameId = incoming.gameId;
    /*    let snsParms = {};
    snsParms.Message = JSON.stringify(message);
    snsParms.TopicArn = topicarn; */
    await WSSend.SendChat(message);
    const data = {};
    const msg = {};
    msg.channel = 'joinedlive';
    data.gameId = activeGameResponse.Item.gameId;
    data.quizName = activeGameResponse.Item.quizName;
    msg.message = data;
    return { statusCode: 200, body: JSON.stringify(msg) };
  } catch (e) {
    console.error(`failed to add player to game table ${JSON.stringify(e)}`);
    return { statusCode: 500, body: 'Error adding player to game' };
  }
}

async function chat(message, domainName, stage) {
  message.domainName = domainName;
  message.stage = stage;
  message.action = 'chat';
  const val = await WSSend.SendChat(message);
  return val;
}

exports.handler = async (event) => {
  let message = {};
  message = JSON.parse(event.body).data;
  message.domainName = event.requestContext.domainName;
  message.stage = event.requestContext.stage;
  switch (message.subaction) {
    case 'joingame':
      return joingame(message, event.requestContext.connectionId,
        event.requestContext.domainName, event.requestContext.stage);
    case 'chat':
      return chat(message, event.requestContext.domainName, event.requestContext.stage);
    default:
      console.warn(`no case defined for ${message.subaction}`);
      break;
  }
  message.action = 'liveplayer';
  const val = await WSSend.SendChat(message);
  return val;
};
