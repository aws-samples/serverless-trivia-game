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
// Function: game_cache:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const redis = require('redis');
const sns = new AWS.SNS();

AWS.config.apiVersions = { dynamodb: '2012-08-10', iot: '2015-05-28' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const eb = new AWS.EventBridge();

const gamesDetailTable = process.env.GAMES_DETAIL_TABLE_NAME;
const redisEndpoint = process.env.REDIS_ENDPOINT;
const redisPort = process.env.REDIS_PORT;
const endpoint = process.env.IOT_ENDPOINT;
const chatTopicArn = process.env.CHAT_TOPIC_ARN;
const eventBusName = process.env.EVENT_BUS_NAME;

const redisOptions = {
  host: redisEndpoint,
  port: redisPort,
};

const redisClient = redis.createClient(redisOptions);

const iotdata = new AWS.IotData({ endpoint });

async function sendHostGameMessage(gameInfo) {
  let message = {};
  // user, channel, message
  message.TopicArn = chatTopicArn;
  message.Message = `${gameInfo.playerName} says "Hosting game: ${gameInfo.quizName}"`;
  message.Subject = 'globalchat';
  try {
    await sns.publish(message).promise();
    return { statusCode: 200, body: "successful" };
  } catch (e) {
    console.error(`error sending sns message ${JSON.stringify(e)}`);
    return { statusCode: 500, body: "could not send sns messaage" };
  }

}
async function addToActiveGames(Item) {
  
  try {
    const gameId = Item.gameId;
    const gameType = 'LIVE=' + Item.playerName;
    const starttime = Item.starttime;
    const host = Item.playerName;
    const event = { Entries: [{
      DetailType: "IoT.game_host"  ,
      Source: 'sts',
      Detail: JSON.stringify({gameId, host, gameType, starttime}),
      EventBusName: eventBusName
    }]};
    await eb.putEvents(event).promise();
  } catch(e) {
    console.error(`could not set game to active ${e}`);
  }
}

async function cacheQuestions(gameDetails) {
  const key = `${gameDetails.gameId}:${gameDetails.playerName}`;
  redisClient.hset(key, 'gameCache', JSON.stringify(gameDetails));
  redisClient.expire(key, 3600);
  redisClient.set(`${key}:currentQuestion`, 0);
  redisClient.expire(`${key}:currentQuestion`, 3600);
  gameDetails.questionList.forEach((question) => {
    redisClient.hset(key, `question${question.questionNumber.toString()}`, JSON.stringify(question));
  });
}

async function getQuestionsFromDatabase(gameInfo) {
  const queryparms = {
    TableName: gamesDetailTable,
    ExpressionAttributeValues: { ':v1': gameInfo.gameId },
    ExpressionAttributeNames: { '#key': 'gameId' },
    KeyConditionExpression: '#key = :v1',
  };
  try {
    const questionList = await ddb.query(queryparms).promise();
    const gameReturn = gameInfo;
    gameReturn.questionList = questionList.Items;
    await cacheQuestions(gameReturn);
    return gameReturn;
  } catch (e) {
    console.error(`could not get questions: ${JSON.stringify(e)}`);
    return e;
  }
}

async function getQuestionsFromCache(gameInfo) {
  const promise = new Promise((resolve, reject) => {
    try {
      const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
      redisClient.hgetall(key, (err, value) => {
        if (!err) {
          if (value) {
            let result = JSON.parse(value.gameCache);
            result.currentQuestionNumber = parseInt(value.currentQuestion,10);
            resolve(result);
          } else {
            reject(gameInfo);
          }
        } else {
          console.error('error on return from cache', err);
          reject(gameInfo);
        }
      });
    } catch (e) {
      console.error('error during check of cache ', e);
      reject(gameInfo);
    }
  });
  return promise;
}

async function sendIoTMessage(params) {
  try {
    await iotdata.publish(params).promise();
    return true;
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)} - ${JSON.stringify(params)}`);
    return false;
  }
}

async function publishQuestionList(gameInfo) {
  const params = {
    topic: `games/${gameInfo.gameId}:${gameInfo.playerName}/questionlist`,
    payload: JSON.stringify(gameInfo),
    qos: 0,
  };
  await sendIoTMessage(params);
}

async function getQuestionList(gameInfo) {
  const promise = new Promise((resolve) => {
    getQuestionsFromCache(gameInfo)
      .then((gameDetails) => {
        resolve(gameDetails);
      })
      .catch(() => {
        const gameDetails = getQuestionsFromDatabase(gameInfo);
        resolve(gameDetails);
      });
  });
  return promise;
}

async function getQuestionNumber(gameInfo) {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  const promise = new Promise((resolve, reject) => {
    redisClient.get(`${key}:currentQuestion`, (err, value) => {
      if (!err) {
        if (value) {
          resolve(value);
        } else {
          resolve(-1);
        }
      } else {
        console.error('error on return from cache', err);
        reject(err);
      }
    });
  });
  return promise;
}

async function handleProcess(gameInfo) {
  delete gameInfo.subaction;
  await addToActiveGames(gameInfo);
  const gameDetails = await getQuestionList(gameInfo);
  const questionNumber = await getQuestionNumber(gameInfo);
  gameDetails.currentQuestionNumber = questionNumber;
  await publishQuestionList(gameDetails);
  await sendHostGameMessage(gameInfo);
  return { statusCode: 200, body: 'game set to be run' };
}

exports.handler = async (event) => {
  return handleProcess(event);
};
