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
// Function: game_start:app.js

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

const sendIoTMessage = async(params: PublishCommandInput): Promise<boolean> => {
  try {
    await iotdata.send(new PublishCommand(params))
    return true;
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)} ${JSON.stringify(params)}`);
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
    console.error(`error in getScoreboard ${e.name} - ${e.message}`);
    return []
  }
}

const sendScoreboard = async(key: string) => {
  const scoreboard = await getScoreboard(key);
  const params: PublishCommandInput = {
    topic: `games/${key}/scoreboard`,
    payload: new TextEncoder().encode(JSON.stringify(scoreboard)),
    qos: 0,
  };
  await sendIoTMessage(params);
}

const startGame = async(gameInfo: any): Promise<boolean> => {
  await sendScoreboard(`${gameInfo.gameId}:${gameInfo.playerName}`);
  return true;
}

export const handler = async (event: any) => {
  if(!connected) {
    await redisClient.connect();
    connected = true;
    return startGame(event);
  } else {
    return startGame(event);
  }
};
