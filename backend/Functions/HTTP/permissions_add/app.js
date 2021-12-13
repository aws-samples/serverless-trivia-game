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
// Function: permissions_add:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

const iot = new AWS.Iot();
AWS.config.update = ({ region: process.env.REGION });

const { ATTACH_POLICY } = process.env;

async function attachPrincipalPolicy(policyName, principal) {
  return new Promise( function(resolve, reject) {
    const params = { policyName, principal };
    iot.attachPrincipalPolicy(params, (err, data) => {
      if (err) {
        console.error(JSON.stringify(err), err.stack); // an error occurred
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const principal = body.identityId;
  await attachPrincipalPolicy(ATTACH_POLICY, principal)
  .then(() => {
    return { statusCode: 200, body: 'Operation Successful' };
  })
  .catch((err)  => {
    console.error('Could not attach policy', JSON.stringify(err));
    return { statusCode: 500, body: 'Could not attach policy' };
  });
};
