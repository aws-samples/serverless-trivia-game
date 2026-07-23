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
// Function: notification_send:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
//import { EventBridgeEvent } from 'aws-lambda';
//import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
//import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
//import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

//const webPush = require('web-push');

// IoT (Step6) fan-out removed for lean scope. Multiplayer notifications flow
// over the WebSocket API (Step5) instead.
const sendIoTMessage = async(topic: string, message: any): Promise<boolean> => {
  console.log(`notification for ${topic}: ${JSON.stringify(message)}`);
  return true;
}

export const handler = async (event: any) => {
  const { playerName } = event.detail;
  try {
    const data: string = JSON.parse(event.detail.data);
    const msg: any = {
        title: event.detail.topic,
        body: event.detail.message,
        data: JSON.stringify(data),
      }
      await sendIoTMessage(playerName, msg)    
  } catch (e) {
    console.error(`error sending notification ${JSON.stringify(e.stack)}`);
  }
};
