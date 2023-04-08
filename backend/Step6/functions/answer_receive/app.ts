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
import { IoTDataPlaneClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-iot-data-plane';
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";
import { RedisClientOptions, createClient } from "redis";

const redisEndpoint: string = process.env.REDIS_ENDPOINT!;
const redisPort: string = process.env.REDIS_PORT!;
const endpoint: string = process.env.IOT_ENDPOINT!;
const scoreStream: string = process.env.RESPONSE_STREAM!;
const region: string = process.env.REGION!;

const iotdata = new IoTDataPlaneClient({ region: region });
const kinesis = new KinesisClient({ region: region});

const redisOptions: RedisClientOptions = { socket: { host: redisEndpoint, port: +redisPort}}
const redisClient = createClient(redisOptions);
let connected: boolean = false;

const dateString = () => {
  const date = new Date();
  return `${(`00${date.getMonth() + 1}`).slice(-2)}/${
    (`00${date.getDate()}`).slice(-2)}/${
    date.getFullYear()} ${
    (`00${date.getHours()}`).slice(-2)}:${
    (`00${date.getMinutes()}`).slice(-2)}:${
    (`00${date.getSeconds()}`).slice(-2)}`;
}

const getQuestionNumber = async(key: string): Promise<number> => {
    try {
      const value = await redisClient.get(`${key}:currentQuestion`)
      if(value) {
        return +value
      } else {
        return 0;
      }
    } catch(e) {
      console.error(`error on return from cache: ${e}`);
      return 0;
    }
}

const sendPlayerCorrect = async (key: string, gameInfo: any) => {
    let playerCorrect = {firstCorrectAnswer: gameInfo.respondingPlayerName, 
      correctAnswer: gameInfo.playerAnswer };
    const params: PublishCommandInput = {
      topic: `games/${key}/playercorrect`,
      payload: new TextEncoder().encode(JSON.stringify(playerCorrect)),
      qos: 0,
    };
    await sendIoTMessage(params);
}

const saveResponse = async(key: string, gameInfo: any, questionNumber: number): Promise<boolean> => {
  const responseKey = `${key}:answers:${questionNumber!}`;
  try {
    await redisClient.setNX(responseKey, gameInfo.respondingPlayerName);
    return true;
  } catch (e) {
    console.error(`setNX error ${e.name}: ${e.message}`)
    return false;
  }
}

const scoreResponse = async(key: string, gameInfo: any, questionNumber: number): Promise<any> => {
  
    const questionKey: string = `question${questionNumber.toString()}`;
    let correctAnswerString: string = '';
    try {
      const value: any = await redisClient.hGet(key, questionKey)
      console.log(`${value}`);
      console.log(`${JSON.stringify(value)}`);
      const question: any = JSON.parse(value);
      let followUp: string = '';
      if(question.answerFollowup) {
        followUp = question.answerFollowup;
      }
      if(question.answerA) {
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
        console.log(`player got it right`)
        let first = await saveResponse(key, gameInfo, questionNumber);
        if(first) {
          console.log(`and they were first ${first}`)
          await sendPlayerCorrect(key, gameInfo);
          redisClient.zIncrBy(`${key}:scoreboard`, 1, gameInfo.respondingPlayerName);
          return { score: 1, message: { text: 'Correct answer', correctAnswer: correctAnswerString, followUp }};
        } else {
          return { score: 0, message: { text: 'Correct answer, but not first', correctAnswer: correctAnswerString, followUp }};
        }
      } else {
        if (question.alternatives) {
          for(let j=0; j<question.alternatives.length; j++) {
            if(question.alternatives[j].toLowerCase()===gameInfo.playerAnswer.toLowerCase()) {
                let first = await saveResponse(key, gameInfo, questionNumber);
                if(first) {
                  await sendPlayerCorrect(key, gameInfo);
                  redisClient.zincrby(`${key}:scoreboard`, parseFloat('1'), gameInfo.respondingPlayerName);
                  return { score: 1, message : { text: 'Correct answer', correctAnswer: correctAnswerString, followUp }};
                } else {
                  return { score: 0, message : { text: 'Correct answer, but not first', correctAnswer: correctAnswerString, followUp }};
                }
            }
          }
          return { score: 0, message: {text: 'Incorrect answer', correctAnswer: correctAnswerString, followUp }};
        } else {
          return { score: 0, message: {text: 'Incorrect answer', correctAnswer: correctAnswerString, followUp }};
        }
      }
    } catch(e) {
      return {};
    }
}

const sendToKinesis = async(gameInfo: any, resp: any): Promise<boolean> => {
  const questions = [{ questionNumber: gameInfo.questionNumber, 
      playerResponse: gameInfo.playerAnswer, 
      correctResponse: resp.message.correctAnswer }];
  const Data = JSON.stringify({ playerName: gameInfo.respondingPlayerName, gameId: gameInfo.gameId,
      quizMode: 'Multiplayer - Live Scoreboard', dateOfQuiz: dateString(),
      questions});
  const streamResp = await kinesis.send(new PutRecordCommand({Data: new TextEncoder().encode(Data), StreamName: scoreStream, PartitionKey: 'score001'}));
  if(!streamResp.ShardId) {
    console.error(`error writing to stream ${JSON.stringify(streamResp)}`);
    return false;
  } else {
    return true;
  }
}

const sendIoTMessage = async(params: PublishCommandInput): Promise<boolean> => {
  try {
    await iotdata.send(new PublishCommand(params));
    return true;
  } catch (e) {
    console.error(`error sending to iot ${e.name}:${e.message} - ${JSON.stringify(params)}`);
    return false;
  }
}

const getScoreboard = async(key: string): Promise<any> => {
  try {
    let value = await redisClient.zRangeWithScores(`${key}:scoreboard`, 0, -1, {REV: true});
    let data: any = [];
    value.map((result: any) => {
      data.push({ playerName: result.value, score: result.score });
    });
    return data;
  } catch(e) {
    console.error(`${e.name}:${e.message}`);
    return {};
  }
}

const sendScoreboard = async(resp: any, key: string) => {
  if (resp.score > 0) {
    const scoreboard: any = await getScoreboard(key);
    const params: PublishCommandInput = {
      topic: `games/${key}/scoreboard`,
      payload: new TextEncoder().encode(JSON.stringify(scoreboard)),
      qos: 0,
    };
    await sendIoTMessage(params);
  }
}

const handleAnswer = async(gameInfo: any): Promise<any> => {
  const key: string = `${gameInfo.gameId}:${gameInfo.playerName}`;
  const questionNumber = await getQuestionNumber(key);
  console.log(`questionNunber: ${questionNumber}`)
  if (isNaN(questionNumber) || questionNumber == 0 ) {
    //error getting question number
    return {statusCode: 200, body: JSON.stringify(questionNumber) };
  }
  if (questionNumber === gameInfo.questionNumber) {
    const resp: any = await scoreResponse(key, gameInfo, questionNumber);
    const topic: string = `games/${key}/results/${gameInfo.respondingPlayerName}`;
    const params: PublishCommandInput = {
      topic,
      payload: new TextEncoder().encode(JSON.stringify({ checked: resp.message })),
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

export const handler = async (event: any) => {
  if(!connected) {
    await redisClient.connect();
    connected = true;
    return handleAnswer(event);
  } else {
    return handleAnswer(event);
  }
};
