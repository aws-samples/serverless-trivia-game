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

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";
import { cors } from "@lambda-middleware/cors";

const questionsTableName: string = process.env.PLAYER_INVENTORY_TABLE_NAME!;
const playerProgressTopic: string = process.env.PLAYER_PROGRESS_TOPIC!;
const leaderboardTopic: string = process.env.LEADERBOARD_TOPIC!;
const scoreStream: string = process.env.RESPONSE_STREAM!;
const region: string = process.env.REGION!;
const mainCorsDomain: string = process.env.MAIN_CORS_DOMAIN!;

let mainCorsDomainArray: Array<string> = [];
if (mainCorsDomain !== "*") {
  mainCorsDomainArray.push(mainCorsDomain)
} 

const ddb = new DynamoDBClient({ region: region});
const ddbDocClient = DynamoDBDocumentClient.from(ddb);
const sns = new SNSClient({ region: region});
const kinesis = new KinesisClient({ region: region});

const dateString = () => {
  const date = new Date();
  const dateStr = `${(`00${date.getMonth() + 1}`).slice(-2)}/${
    (`00${date.getDate()}`).slice(-2)}/${
    date.getFullYear()} ${
    (`00${date.getHours()}`).slice(-2)}:${
    (`00${date.getMinutes()}`).slice(-2)}:${
    (`00${date.getSeconds()}`).slice(-2)}`;

  return dateStr;
}

const sendProgressMessage = async (progressMsg: string, player: string, owner: string) => {
  if (player !== owner) {
    try {
      return await sns.send(new PublishCommand({
        TopicArn: playerProgressTopic,
        Message: progressMsg,
      }));
    } catch (e) {
      console.error(`Error when sending Player Progress Message ${JSON.stringify(e)}`);
      return { statusCode: 500, body: { error: 'Could not send player progress message' } };
    }
  }
  return { statusCode: 200, body: { message: 'not needed, player is owner' } };
}

const sendLeaderboardMessage = async (leaderboardMsg: string, player: string, owner: string) => {
  console.log(`sendLeaderboardMessage ${player} - ${owner}`);
  if (player !== owner) {
    try {
      return await sns.send(new PublishCommand({
        TopicArn: leaderboardTopic,
        Message: leaderboardMsg,
      }));
    } catch (e) {
      console.error(`Error when sending Leaderboard Message ${JSON.stringify(e)}`);
      return { statusCode: 500, body: { error: 'Could not send leaderboard message' } };
    }
  } else {
    return { statusCode: 200, body: { message: 'not needed, player is owner' } };  
  }
}

const sendScoreEvents = async(Data: string) => {
  console.log(`sendScoreEvents ${Data}`);
  let ret = await kinesis.send(new PutRecordCommand({Data: new TextEncoder().encode(Data), 
    StreamName: scoreStream, PartitionKey: 'score001' }));
  if(Object.prototype.hasOwnProperty.call(ret, 'ShardId')){
    return 1;
  } else {
    console.error(`error writing to stream ${JSON.stringify(ret)}`);
    return { statusCode: 500, body: { error: 'Could not send score events' } };
  }
}

const scoreGame = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // load questions for the game with the correct answers
  console.log(`scoreGame`)
  const gameId = event.pathParameters?.gameId;
  let playerData: any;
  if(!gameId || !event.body) {
    return { statusCode: 400, body: "missing data for scoring" }
  }
  if(event.body) {
    playerData = JSON.parse(event.body);
  }
  
  let questions;
  try {
    console.log(`${playerData.owner} - ${gameId}`)
    
    let gameInfo = await ddbDocClient.send(new GetCommand({
      TableName: questionsTableName,
      Key: { pk: playerData.owner, sk: gameId }}))
    console.log(`${JSON.stringify(gameInfo)}`);

    if(!gameInfo.Item) {
      return { statusCode: 400, body: '{message: "Error getting details for scoring:}' }      
    }
    const owner: string = gameInfo.Item.owner
    const quizName: string = gameInfo.Item.quizName
    let points: number = 0;
    const maxPoints: number = +gameInfo.Item.questions.length;
    console.log(`${maxPoints}`)
    let answerboard: any = [];
    let analytics: any = [];
    gameInfo.Item.questions.forEach((question: any) => {
      console.log(`question: ${JSON.stringify(question)}`)
      console.log(`compraing to: ${JSON.stringify(playerData.responses[question.questionNumber - 1].response)}`)
      let alts = '';
      if (question.alternatives) {
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
        playerResponse: playerData.responses[question.questionNumber - 1].response,
      };
      answerboard.push(answer);
      const playerAnswer = playerData.responses[question.questionNumber - 1].response;
      if (playerAnswer.toLowerCase() === question.correctAnswer.toLowerCase()) {
        points += 1;
        playercorrect = true;
      } else if ('alternatives' in question) {
        question.alternatives.forEach((alternative: string) => {
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
        correctResponse, playerCorrect: playercorrect };
      analytics.push(analytic);
    });

    // done scoring, prepare all messages
    const analyticMsg = {playerName: playerData.playerName, dateOfQuiz: dateString(), gameId: gameInfo.gameId, 
      quizMode: gameInfo.quizMode, questions: analytics};
    const score = (points / maxPoints) * 100;
    let scoremsg = { score, answerboard };
    console.log(`scoremsg: ${JSON.stringify(scoremsg)}`)
    const leaderboardJSON = {
      gameId, quizName, playerid: playerData.playerName, score,
    };
    console.log(`leaderboardJSON: ${JSON.stringify(leaderboardJSON)}`)
    const leaderboardmsg = JSON.stringify(leaderboardJSON);
    const progressmsg = JSON.stringify({
      playerid: playerData.playerName, experience: points, wins: 0, owner,
    });
    console.log(`leaderboardmsg: ${JSON.stringify(leaderboardmsg)}`)
    await Promise.all(
      [sendProgressMessage(progressmsg, playerData.playerName, owner),
        sendLeaderboardMessage(leaderboardmsg, playerData.playerName, owner),
        sendScoreEvents(JSON.stringify(analyticMsg))],
    )
      .catch((e) => {
        console.error(`error sending progress ${JSON.stringify(e.stack)}`);
        return 'error';
      });
    return {statusCode: 200, body: JSON.stringify(scoremsg)};
  } catch (e) {
    console.error(`Scoring of invalid game ${JSON.stringify(e.stack)}`);
    console.error(`game info ${JSON.stringify(playerData)}`);
    return { statusCode: 500, body: 'Looks like an invalid game' };
  }
}

const originLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`${JSON.stringify(event)}`);
  return await scoreGame(event);
};

export const handler = cors({
  allowCredentials: true,
  allowedOrigins: mainCorsDomainArray,
  allowedMethods: [
    'OPTIONS',
    'HEAD',
    'GET',
  ],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
  ]
})(originLambdaHandler)