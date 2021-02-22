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
// Function: question_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-param-reassign: ["error", { "props": true,
"ignorePropertyModificationsFor": ["questionData"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const questionTableName = process.env.QUESTIONS_TABLE_NAME;

async function saveQuestion(gameId, questionNumber, questionData) {
  questionData.gameId = gameId;
  questionData.questionNumber = parseInt(questionNumber, 10);
  const Item = questionData;
  try {
    await ddb.put({
      TableName: questionTableName,
      Item,
    }).promise();
    const msg = { message: 'Question Saved', gameId, questionNumber };
    return { statusCode: 200, body: JSON.stringify(msg) };
  } catch (e) {
    console.error(`Question not saved ${JSON.stringify(e.stack)}`);
    console.error(`record:  ${JSON.stringify(Item)}`);
    return { statusCode: 500, body: JSON.stringify({ message: 'Question Not Saved' }) };
  }
}

exports.handler = async (event) => {
  const questionData = JSON.parse(event.body);
  const { gameId } = event.pathParameters;
  const { questionNumber } = event.pathParameters;
  if (gameId === '' || questionNumber === 0) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Missing Path Parameters' }) };
  }
  const retVal = await saveQuestion(gameId, questionNumber, questionData);
  return retVal;
};
