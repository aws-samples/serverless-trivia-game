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
// Function: webpush_vapid_generate:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const webPush = require('web-push');
const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');

AWS.config.update = ({ region: process.env.REGION });

const ssm = new AWS.SSM();

async function handleDelete(event) {
  try {
    const stackName = event.ResourceProperties.StackName;
    const publicKeyPath = `/${stackName}/vapid/public`;
    const privateKeyPath = `/${stackName}/vapid/private`;
    const params = {
      Names: [
        publicKeyPath,
        privateKeyPath,
      ],
    };
    await ssm.deleteParameters(params).promise();
    return { status: 'SUCCESS', data: {} };
  } catch (e) {
    console.error(`error deleting SSM parameters. ${JSON.stringify(e.stack)}`);
    return { status: 'FAILED', data: { Error: 'Delete parameters failed' } };
  }
}

async function handleCreate(event) {
  try {
    const vapidKeys = webPush.generateVAPIDKeys();
    const stackName = event.ResourceProperties.StackName;
    const publicKeyPath = `/${stackName}/vapid/public`;
    const params = {
      Name: publicKeyPath,
      Value: vapidKeys.publicKey,
      DataType: 'text',
      Description: 'Public Key for Voluntary Application Server Identification for Web Push',
      Overwrite: true,
      Type: 'String',
    };
    await ssm.putParameter(params).promise();
    const privateKeyPath = `/${stackName}/vapid/private`;
    const params2 = {
      Name: privateKeyPath,
      Value: vapidKeys.privateKey,
      DataType: 'text',
      Description: 'Private Key for Voluntary Application Server Identification for Web Push',
      Overwrite: true,
      Type: 'SecureString',
    };
    await ssm.putParameter(params2).promise();
    return { status: 'SUCCESS', data: { PublicKeyPath: publicKeyPath, PrivateKeyPath: privateKeyPath, PublicKey: vapidKeys.publicKey } };
  } catch (e) {
    console.error(`error creating parameters ${JSON.stringify(e.stack)}`);
    return { status: 'FAILED', data: { Error: 'Put parameters failed' } };
  }
}

async function sendResponseAsync(event, context, responseStatus, responseData) {
  const responsePromise = new Promise((resolve, reject) => {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: `CloudWatch Log Stream: ${context.logStreamName}`,
      PhysicalResourceId: context.logStreamName,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData,
    });
    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'PUT',
      headers: {
        'content-type': '',
        'content-length': responseBody.length,
      },
    };
    const request = https.request(options, () => {
      resolve(JSON.parse(responseBody));
      context.done();
    });
    request.on('error', (error) => {
      console.error(`sendResponse Error: ${error}`);
      reject(error);
      context.done();
    });
    request.write(responseBody);
    request.end();
  });
  return responsePromise;
}

exports.handler = async (event, context) => {
  /* eslint-disable no-console */
  console.info(`REQUEST RECEIVED:\n${JSON.stringify(event)}`);
  let res;
  if (event.RequestType === 'Delete') {
    // DELETE
    res = await handleDelete(event);
  } else {
    // CREATE or UPDATE
    res = await handleCreate(event);
  }
  await sendResponseAsync(event, context, res.status, res.data);
};
