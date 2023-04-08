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
// Function: playeravatar_thumbnail:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const AWS = require('aws-sdk');

const sharp = require('sharp');

const s3 = new AWS.S3();

const playerAvatarBucket = process.env.PLAYER_AVATAR_BUCKET;

exports.handler = async (event) => {
  try {
    console.log(JSON.stringify(event));
    const folders = event.key.split('/');
    const image = await s3.getObject({ Bucket: event.bucketName, Key: event.key }).promise();
    const resizedImg = await sharp(image.Body).resize(100, 100, { fit: 'cover' }).toFormat('jpeg').toBuffer();
    //performance fix - store thumbnail in /user/current to allow for calculatable retrieval
    /*const path = event.key.substring(0, event.key.lastIndexOf('/'));
    const thumbnailKey = `${path}/thumb.jpg`;
    await s3.putObject({ Bucket: event.bucketName, Body: resizedImg, Key: thumbnailKey }).promise();
    */
    const thumbnailKey = `${folders[0]}/current/thumb.jpg`;
    await s3.putObject({ Bucket: playerAvatarBucket, Body: resizedImg, Key: thumbnailKey }).promise();
    return {
      status: 200,
      key: thumbnailKey,
      username: folders[0]
    };
  } catch (err) {
    console.error(`error creating thumbnail ${JSON.stringify(err.stack)}`);
    throw err;
  }
};