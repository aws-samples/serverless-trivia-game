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
// Function: player_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
 
//const { v4: uuidv4 } = require('uuid');

const playersTable = process.env.PLAYER_TABLE_NAME;
const playerAvatarBucket = process.env.PLAYER_AVATAR_BUCKET;

async function savePlayer(playerName, playerItem) {
  try {
    const expressionAttributeValues = {};
    let updateExpression = 'SET latestUpdate = :updateTime';
    expressionAttributeValues[':updateTime'] = Date.now();
    Object.keys(playerItem).forEach((key) => {
      if (key !== 'playerName') {
        updateExpression += `, ${key} = :${key}`;
        expressionAttributeValues[`:${key}`] = playerItem[key];
      }
    });
    const params = {
      TableName: playersTable,
      Key: { playerName },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'UPDATED_NEW',
    };
    const ddbResult = await ddb.update(params).promise();
    return {
      status: 200,
      body: {
        avatar: ddbResult.Attributes.avatar,
        thumbnail: ddbResult.Attributes.thumbnail,
      },
    };
  } catch (e) {
    console.error(`error updating user ${JSON.stringify(e.stack)}`);
    throw e;
  }
}

async function signedUrl(playerName, playerItem) {
  const fileExt = playerItem.newavatar.split('.').pop();
  const now = new Date();
  const filekey = `${playerName}/${now.toISOString()}/avatar.${fileExt}`;
  const signedurl = await s3.getSignedUrl('putObject', {
    Bucket: playerAvatarBucket,
    Key: filekey,
    ContentType: playerItem.fileType,
    Metadata: {
      playerId: playerName,
    },
  });
  return signedurl;
}

exports.handler = async (event) => {
  const { playerId } = event.pathParameters;
  const playerItem = JSON.parse(event.body);
  if (Object.prototype.hasOwnProperty.call(playerItem, 'newavatar') && playerItem.newavatar !== '') {
    const msg = {};
    msg.signedurl = await signedUrl(playerId, playerItem);
    return { statusCode: 200, body: JSON.stringify(msg) };
  }
  const retVal = await savePlayer(playerId, playerItem);
  return retVal;
};
