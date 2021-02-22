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
// Function: game_answer:app.js

/* eslint no-console: ["error", { allow: ["warn", "error", "info"] }] */

const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10', sns: '2010-03-31', kinesis: '2013-12-02'};
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const kinesis = new AWS.Kinesis();

const questionsTableName = process.env.QUESTIONS_TABLE_NAME;
const playerProgressTopic = process.env.PLAYER_PROGRESS_TOPIC;
const leaderboardTopic = process.env.LEADERBOARD_TOPIC;
const scoreStream = process.env.RESPONSE_STREAM;

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

async function sendProgressMessage(progressMsg, player, owner) {
  if (player !== owner) {
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
  return { statusCode: 200, body: { message: 'not needed, player is owner' } };
}

async function sendLeaderboardMessage(leaderboardMsg, player, owner) {
  if (player !== owner) {
    try {
      const retval = await sns.publish({
        TopicArn: leaderboardTopic,
        Message: leaderboardMsg,
      }).promise();
      return retval;
    } catch (e) {
      console.error(`Error when sending Leaderboard Message ${JSON.stringify(e.stack)}`);
      return { statusCode: 500, body: { error: 'Could not send leaderboard message' } };
    }
  }
  return { statusCode: 200, body: { message: 'not needed, player is owner' } };
}

async function sendScoreEvents(Data) {
  let ret = await kinesis.putRecord({Data, StreamName: scoreStream, PartitionKey: 'score001' }).promise();
  if(ret.hasOwnProperty('ShardId')){
    return 1;
  } else {
    console.error(`error writing to stream ${JSON.stringify(ret)}`);
    return { statusCode: 500, body: { error: 'Could not send score events' } };
  }
}

async function scoreGame(gameId, gameInfo) {
  // load questions for the game with the correct answers
  const pe = 'quizName, #o, quizType, question, questionNumber, correctAnswer,'
    + 'alternatives, answerFollowup, answerURI';
  const queryparms = {
    TableName: questionsTableName,
    ExpressionAttributeValues: { ':v1': gameId },
    KeyConditionExpression: 'gameId = :v1',
    ProjectionExpression: pe,
    ExpressionAttributeNames: { '#o': 'owner' },
  };
  let questions;
  try {
    questions = await ddb.query(queryparms).promise();
    const { owner } = questions.Items[0];
    const { quizName } = questions.Items[0];
    let points = 0;
    const maxPoints = questions.Count;
    const answerboard = [];
    const analytics = [];
    questions.Items.forEach((question) => {
      let alts = '';
      if (Object.prototype.hasOwnProperty.call(question, 'alternatives')) {
        alts = question.alternatives.join(',');
      }
      let playercorrect = false;
      let correctResponse = '';
      const answer = {
        questionNumber: question.questionNumber,
        question: question.question,
        answer: question.correctAnswer,
        alternatives: alts,
        answerFollowup: question.answerFollowup,
        playerResponse: gameInfo.responses[question.questionNumber - 1].response,
      };
      answerboard.push(answer);
      const playerAnswer = gameInfo.responses[question.questionNumber - 1].response;
      if (playerAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
        points += 1;
        playercorrect = true;
      } else if ('alternatives' in question) {
        question.alternatives.forEach((alternative) => {
          if (playerAnswer.toLowerCase() === alternative.toLowerCase()) {
            points += 1;
            correctResponse = question.correctAnswer;
            playercorrect = true;
          }
        });
      }
      if(correctResponse === ''){
        correctResponse = question.correctAnswer;
      }
      const analytic = {
        questionNumber: question.questionNumber,
        playerResponse: playerAnswer,
        correctResponse };
      analytics.push(analytic);
    });

    // done scoring, prepare all messages
    const analyticMsg = {playerName: gameInfo.playerName, dateOfQuiz: dateString(), gameId: gameInfo.gameId, 
      quizMode: gameInfo.quizMode, questions: analytics};
    const score = points / maxPoints;
    console.info(`${gameInfo.playerName} scored ${String(score)}`);
    let scoremsg = { score, answerboard };
    const leaderboardJSON = {
      gameId, quizName, playerid: gameInfo.playerName, score,
    };
    const leaderboardmsg = JSON.stringify(leaderboardJSON);
    const progressmsg = JSON.stringify({
      playerid: gameInfo.playerName, experience: points, wins: 0, owner,
    });
    await Promise.all(
      [sendProgressMessage(progressmsg, gameInfo.playerName, owner),
        sendLeaderboardMessage(leaderboardmsg, gameInfo.playerName, owner),
        sendScoreEvents(JSON.stringify(analyticMsg))],
    )
      .then(() => { console.info(`scoremsg ${JSON.stringify(scoremsg)}`); })
      .catch((e) => {
        console.error(`error sending progress ${JSON.stringify(e.stack)}`);
        scoremsg = 'error';
      });
    return (scoremsg);
  } catch (e) {
    console.error(`Scoring of invalid game ${JSON.stringify(e.stack)}`);
    console.error(`game info ${JSON.stringify(gameInfo)}`);
    return { statusCode: 500, body: 'Looks like an invalid game' };
  }
}

exports.handler = (event) => {
  const { gameId } = event.pathParameters;
  const gameInfo = JSON.parse(event.body);
  const results = scoreGame(gameId, gameInfo);
  return results;
};
