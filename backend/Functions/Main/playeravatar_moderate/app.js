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
// Function: playeravatar_moderate:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const AWS = require('aws-sdk');

const rekognition = new AWS.Rekognition();

/**
 * Detects inappropriate content in an image.
 * @param {Sharp} imageBuffer - The original image.
 * @param {Object} options - The options to pass to the dectectModerationLables Rekognition function
 */
async function detectInappropriateContent(bucket, key, options) {
  const params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
    MinConfidence: options.minConfidence ? parseFloat(options.minConfidence) : 75,
  };

  try {
    const response = await rekognition.detectModerationLabels(params).promise();
    return {
      status: 200,
      appropriate: (response.ModerationLabels.length === 0),
      moderationLabels: response.ModerationLabels,
    };
  } catch (err) {
    console.error(`error in moderation step ${JSON.stringify(err.stack)}`);
    throw err;
  }
}

exports.handler = async (event) => {
  const ret = await detectInappropriateContent(event.bucketName, event.key, {});
  return ret;
};
