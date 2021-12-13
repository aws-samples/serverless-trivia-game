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
// Function: question_send:app.js

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

async function getQuestionNumberFromCache(topicKey) {
  const promise = new Promise((resolve, reject) => {
    try {
      // question counter starts at 0
      const localKey = `${topicKey}:currentQuestion`;
      redisClient.incr(localKey, (err, id) => {
        if (err) {
          console.error('error incrementing questionnumber key', err);
          reject(err);
        } else {
          resolve(id);
        }
      });
    } catch (e) {
      console.error(`error retreiving question number ${e}`);
      reject(e);
    }
  });
  return promise;
}

async function getQuestion(gameKey, questionKey) {
  const promise = new Promise((resolve, reject) => {
    try {
      redisClient.hget(gameKey, questionKey, (err, value) => {
        if (!err) {
          if (value) {
            const question = JSON.parse(value);
            delete question.correctAnswer;
            resolve(question);
          } else {
            reject(questionKey);
          }
        } else {
          console.error('error on return from cache', err);
          reject(questionKey);
        }
      });
    } catch (e) {
      console.error('error during check of cache ', e);
      reject(questionKey);
    }
  });
  return promise;
}

async function sendQuestionToTopic(topic, question) {
  const params = {
    topic,
    payload: JSON.stringify(question),
    qos: 0,
  };
  try {
    await iotdata.publish(params).promise();
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)} ${JSON.stringify(params)}`);
  }
}

async function sendQuestion(gameKey, questionKey) {
  await getQuestion(gameKey, questionKey)
    .then(async (question) => {
      await sendQuestionToTopic(`games/${gameKey}/question`, question);
      return { statusCode: 200, body: 'question sent' };
    })
    .catch((err) => {
      console.error('could not send question', err);
      return { statusCode: 500, body: 'could not send question' };
    });
}

async function sendNextQuestion(gameInfo) {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  await getQuestionNumberFromCache(key)
    .then(async (questionNumber) => {
      const questionKey = `question${questionNumber.toString()}`;
      const response = await sendQuestion(key, questionKey);
      return response;
    })
    .catch((err) => {
      // end of game reached or bad cache
      console.error('could not get question number', err);
      return { statusCode: 500, body: 'could not get valid question' };
    });
}

exports.handler = async function (event) {
  return sendNextQuestion(event);
};
