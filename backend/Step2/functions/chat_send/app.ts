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
// Function: send_chat:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { SNSEvent, SNSMessage } from 'aws-lambda';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';

const region: string = process.env.REGION!;

const iotdata = new IoTDataPlaneClient({ region: region });

const sendIoTMessage = async(params: PublishCommand) => {
  try {
    await iotdata.send(params);
    return true;
  } catch (e) {
    console.error(`error sending to iot ${JSON.stringify(e)} ${JSON.stringify(params)}`);
    return false;
  }
}

const sendChat = async(channel: string, message: string) => {
  return await sendIoTMessage(new PublishCommand({
    topic: `chat/${channel}`,
    payload: new TextEncoder().encode(JSON.stringify({ message })),
    qos: 0,
  }));
}

exports.handler = async (event: SNSEvent) => {
  console.log(JSON.stringify(event));
  let message: SNSMessage = event.Records[0].Sns;
  const msg: string = message.Message!;
  const channel: string = message.Subject!;
  return await sendChat(channel, msg);
};
