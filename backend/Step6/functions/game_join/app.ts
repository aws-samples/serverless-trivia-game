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
// Function: game_join:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { RedisClientOptions, createClient } from "redis";

const redisEndpoint: string = process.env.REDIS_ENDPOINT!;
const redisPort: string = process.env.REDIS_PORT!;

const redisOptions: RedisClientOptions = { socket: { host: redisEndpoint, port: +redisPort}}
const redisClient = createClient(redisOptions);
let connected: boolean = false;

const addPlayerToLeaderboard = async(key: string, gameInfo: any): Promise<boolean> => {
  try {
    await redisClient.zAdd(`${key}:scoreboard`, {value: gameInfo.respondingPlayerName, score: '0'}, {NX: true} );
    return true;
  } catch(e) {
    console.error(`${e.name} - ${e.message}`);
    return false;
  }
}

const handleJoinedGame = async(gameInfo: any): Promise<any> => {
  try {
    await addPlayerToLeaderboard(`${gameInfo.gameId}:${gameInfo.playerName}`, gameInfo)
    return { statusCode: 200, body: 'added' };
  } catch(e) {
    console.error(`could not join game ${e.name} - ${e.message}`);
    return { statusCode: 200, body:'could not add to redis'};
  }
}

export const handler = async (event: any) => {
  console.log(`${JSON.stringify(event)}`)
  if(!connected) {
    await redisClient.connect();
    connected = true;
    return handleJoinedGame(event);
  } else {
    return handleJoinedGame(event);
  }
  
};
