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
// Function: game_listonmarketplace:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const marketplaceTableName = process.env.MARKETPLACE_TABLE_NAME;
const playerInventoryTable = process.env.PLAYER_INVENTORY_TABLE_NAME;

async function ListOnMarketplace(playerName, gameId, amount) {
  const Key = { playerName, gameId };
  try {
    const getGame = await ddb.get({ TableName: playerInventoryTable, Key }).promise();
    if (Object.prototype.hasOwnProperty.call(getGame, 'Item')) {
      if (getGame.Item.quizMode === 'Run Anytime') {
        console.error(`tried to sell single player game ${JSON.stringify(getGame.Item)}`);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'cannot sell single player game' }),
        };
      }
      if (getGame.Item.usage !== 'unlimited') {
        console.error(`tried to sell a purchased game ${JSON.stringify(getGame.Item)}`);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'cannot sell purchased game' }),
        };
      }
      const { Item } = getGame;
      Item.usage = 1;
      Item.amount = amount;
      const result = await ddb.put({ TableName: marketplaceTableName, Item }).promise();
      return { statusCode: 200, body: JSON.stringify({ gameid: result.gameId }) };
    }
    console.error(`Could not find game in inventory ${JSON.stringify(Key)}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'could not find game in inventory' }) };
  } catch (e) {
    console.error(`Could not save game to marketplace ${JSON.stringify(e)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not save game to marketplace' }),
    };
  }
}

exports.handler = async (event) => {
  const { playerId } = event.pathParameters;
  const { gameId } = event.pathParameters;
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    console.error(`not JSON ${JSON.stringify(e.stack)}`);
    return { statusCode: 500, body: JSON.stringify({ reason: 'invalid data sent' }) };
  }
  return ListOnMarketplace(playerId, gameId, body.amount);
};
