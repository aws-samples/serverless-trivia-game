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
// Function: answer_receive:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');
const redis = require('redis');
AWS.config.apiVersions = { iot: '2015-05-28', kinesis: '2013-12-02' };
AWS.config.update = ({ region: process.env.REGION });

const redisEndpoint = process.env.REDIS_ENDPOINT;
const redisPort = process.env.REDIS_PORT;
const endpoint = process.env.IOT_ENDPOINT;
const scoreStream = process.env.RESPONSE_STREAM;

const redisOptions = {
  host: redisEndpoint,
  port: redisPort,
};

const redisClient = redis.createClient(redisOptions);

const iotdata = new AWS.IotData({ endpoint });

const kinesis = new AWS.Kinesis();

function dateString() {
  const date = new Date();
  const dateStr = `${(`00${date.getMonth() + 1}`).slice(-2)}/${
    (`00${date.getDate()}`).slice(-2)}/${
    date.getFullYear()} ${
    (`00${date.getHours()}`).slice(-2)}:${
    (`00${date.getMinutes()}`).slice(-2)}:${
    (`00${date.getSeconds()}`).slice(-2)}`;

  return dateStr;
}

async function getQuestionNumber(key) {
  const promise = new Promise((resolve, reject) => {
    redisClient.get(`${key}:currentQuestion`, (err, value) => {
      if (!err) {
        if (value) {
          resolve(parseInt(value, 10));
        } else {
          console.error(`error checking value ${JSON.stringify(err)}`);
          reject(err);
        }
      } else {
        console.error('error on return from cache', err);
        reject(err);
      }
    });
  });
  return promise;
}

async function sendPlayerCorrect(key, gameInfo) {
    let playerCorrect = {firstCorrectAnswer: gameInfo.respondingPlayerName, 
      correctAnswer: gameInfo.playerAnswer };
    const params = {
      topic: `games/${key}/playercorrect`,
      payload: JSON.stringify(playerCorrect),
      qos: 0,
    };
    await sendIoTMessage(params);
}

async function saveResponse(key, gameInfo, questionNumber) {
  const promise = new Promise((resolve, reject) => {
    const responseKey = `${key}:answers:${questionNumber}`;
    try {
      let ret = redisClient.setnx(responseKey, gameInfo.respondingPlayerName);
      resolve(ret);
    } catch (err) {
      reject(err);
    }
  });
  return promise;
}

async function scoreResponse(key, gameInfo, questionNumber) {
  const promise = new Promise((resolve, reject) => {
    const questionKey = `question${questionNumber.toString()}`;
    let correctAnswerString = '';
    redisClient.hget(key, questionKey, async (err, value) => {
      if (err) {
        reject(err);
        return;
      }
      const question = JSON.parse(value);
      let followUp = '';
      if(Object.prototype.hasOwnProperty.call(question, 'answerFollowup')) {
        followUp = question.answerFollowup;
      }
      if(Object.prototype.hasOwnProperty.call(question, 'answerA')) {
        switch(question.correctAnswer) {
          case 'A':
            correctAnswerString = `${question.correctAnswer} - ${question.answerA}`;
            break;
          case 'B':
            correctAnswerString = `${question.correctAnswer} - ${question.answerB}`;
            break;
          case 'C':
            correctAnswerString = `${question.correctAnswer} - ${question.answerC}`;
            break;
          case 'D':
            correctAnswerString = `${question.correctAnswer} - ${question.answerD}`;
            break;
        }
      } else {
        correctAnswerString = question.correctAnswer;
      }
      if (question.correctAnswer.toLowerCase() === gameInfo.playerAnswer.toLowerCase()) {
        let first = await saveResponse(key, gameInfo, questionNumber);
        if(first) {
          await sendPlayerCorrect(key, gameInfo);
          redisClient.zincrby(`${key}:scoreboard`, parseFloat(1), gameInfo.respondingPlayerName);
          resolve({ score: 1, message: { text: 'Correct answer', correctAnswer: correctAnswerString, followUp }});
        } else {
          resolve({ score: 0, message: { text: 'Correct answer, but not first', correctAnswer: correctAnswerString, followUp }});
        }
      } else {
        if (Object.prototype.hasOwnProperty.call(question, 'alternatives')) {
          for(let j=0; j<question.alternatives.length; j++) {
            if(question.alternatives[j].toLowerCase()===gameInfo.playerAnswer.toLowerCase()) {
                let first = await saveResponse(key, gameInfo, questionNumber);
                if(first) {
                  await sendPlayerCorrect(key, gameInfo);
                  redisClient.zincrby(`${key}:scoreboard`, parseFloat(1), gameInfo.respondingPlayerName);
                  resolve({ score: 1, message : { text: 'Correct answer', correctAnswer: correctAnswerString, followUp }});
                } else {
                  resolve({ score: 0, message : { text: 'Correct answer, but not first', correctAnswer: correctAnswerString, followUp }});
                }
            }
          }
          resolve({ score: 0, message: {text: 'Incorrect answer', correctAnswer: correctAnswerString, followUp }});
        } else {
          resolve({ score: 0, message: {text: 'Incorrect answer', correctAnswer: correctAnswerString, followUp }});
        }
      }
    });
  });
  return promise;
}

async function sendToKinesis(gameInfo, resp) {
  const questions = [{ questionNumber:gameInfo.questionNumber, 
      playerResponse: gameInfo.playerAnswer, 
      correctResponse: resp.message.correctAnswer }];
  const Data = JSON.stringify({ playerName: gameInfo.respondingPlayerName, gameId: gameInfo.gameId,
      quizMode: 'Multiplayer - Live Scoreboard', dateOfQuiz: dateString(),
      questions});
  let streamResp = await kinesis.putRecord({Data, StreamName: scoreStream, PartitionKey: 'score001'}).promise();
  if(!Object.prototype.hasOwnProperty.call(streamResp, 'ShardId')) {
    console.error(`error writing to stream ${JSON.stringify(streamResp)}`);
    return { statusCode: 500, body: { error: 'Could not send score events' } };
  } else {
    return 1;
  }
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

async function getScoreboard(key) {
  const promise = new Promise((resolve, reject) => {
    redisClient.zrevrange(`${key}:scoreboard`, 0, 20, 'withscores', (err, value) => {
      if (err) {
        console.error(JSON.stringify(err));
        reject(err);
        return;
      }
      const data = [];
      value.map((result, index) => {
        if (index % 2 === 0) {
          data.push(value[index] = { playerName: value[index], score: value[index + 1] });
        }
      });
      resolve(data);
    });
  });
  return promise;
}

async function sendScoreboard(resp, key) {
  if (resp.score > 0) {
    const scoreboard = await getScoreboard(key);
    const params = {
      topic: `games/${key}/scoreboard`,
      payload: JSON.stringify(scoreboard),
      qos: 0,
    };
    await sendIoTMessage(params);
  }
}

async function handleAnswer(gameInfo) {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  const questionNumber = await getQuestionNumber(key, gameInfo);
  if (isNaN(questionNumber)) {
    //error getting question number
    return {statusCode: 200, body: JSON.stringify(questionNumber) };
  }
  if (questionNumber === gameInfo.questionNumber) {
    const resp = await scoreResponse(key, gameInfo, questionNumber);
    const topic = `games/${key}/results/${gameInfo.respondingPlayerName}`;
    const params = {
      topic,
      payload: JSON.stringify({ checked: resp.message }),
      qos: 0,
    };
    await sendToKinesis(gameInfo, resp);
    await sendIoTMessage(params);
    await sendScoreboard(resp, key);
    return { statusCode: 200, body: JSON.stringify({ status: resp.message.text }) };
  } else {
    return { statusCode: 200, body: JSON.stringify({ err: 'wrong question answered' }) };
  }
}

exports.handler = async function (event) {
  return handleAnswer(event);
};
