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
import { IoTDataPlaneClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-iot-data-plane';
import { RedisClientOptions, createClient } from "redis";

const redisEndpoint: string = process.env.REDIS_ENDPOINT!;
const redisPort: string = process.env.REDIS_PORT!;
const endpoint: string = process.env.IOT_ENDPOINT!;
const region: string = process.env.REGION!;

const iotdata = new IoTDataPlaneClient({ region: region });

const redisOptions: RedisClientOptions = { socket: { host: redisEndpoint, port: +redisPort}}
const redisClient = createClient(redisOptions);
let connected: boolean = false;

const getQuestionNumberFromCache = async(topicKey:string): Promise<number> => {
  try {
    // question counter starts at 0
    const id = await redisClient.incr(`${topicKey}:currentQuestion`);
    return id;
  } catch (e) {
    console.error(`error retreiving question number ${e.name} - ${e.message}`);
    return -1;
  }
}

const getQuestion = async(gameKey: string, questionKey: string): Promise<any> => {
  try {
    const value = await redisClient.hGet(gameKey, questionKey);
    if (value) {
      const question: any = JSON.parse(value);
      delete question.correctAnswer;
      return question;
    } else {
      return questionKey;
    }
  } catch (e) {
    console.error(`error during check of cache - ${e.name} - ${e.message}`);
    return questionKey;
  }
}

const sendQuestionToTopic = async(topic: string, question: any): Promise<boolean> => {
  try {
    await iotdata.send(new PublishCommand({
    topic,
    payload: new TextEncoder().encode(JSON.stringify(question)),
    qos: 0,
  }));
    return true;
  } catch (e) {
    console.error(`error sending to iot ${e.name} - ${e.message} : ${JSON.stringify(topic)} ${JSON.stringify(question)}`);
    return false;
  }
}

const sendQuestion = async(gameKey: string, questionKey: string): Promise<boolean> => {
  const question = await getQuestion(gameKey, questionKey)
  if(question!==questionKey) {
    try {
      return await sendQuestionToTopic(`games/${gameKey}/question`, question);
    } catch (e) {
      console.error(`could not send question ${e.name} - ${e.message}`);
      return false;
    }
  } else {
    console.error('could not get question');
    return false;
  }}

const sendNextQuestion = async(gameInfo: any): Promise<boolean> => {
  const key = `${gameInfo.gameId}:${gameInfo.playerName}`;
  const questionNumber = await getQuestionNumberFromCache(key)
  if (questionNumber>0) {
    const questionKey = `question${questionNumber.toString()}`;
    return await sendQuestion(key, questionKey);
  } else {
    console.error('could not get question number');
    return false;
  }
}

export const handler = async(event: any) => {
  if(!connected) {
    await redisClient.connect();
    connected = true;
  }
  return await sendNextQuestion(event);
};
