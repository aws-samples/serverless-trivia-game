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
// Function: activegames_list:app.ts

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand  } from "@aws-sdk/lib-dynamodb";

const tableName: string = process.env.TABLE_NAME!;
const region: string = process.env.REGION!;

const marshallOptions = {
  convertEmptyValues: false, // false, by default.
  removeUndefinedValues: true, // false, by default.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  wrapNumbers: false, // false, by default.
};


const ddb = new DynamoDBClient({ region: region});
const ddbClient = DynamoDBDocumentClient.from(ddb, {
  marshallOptions,
  unmarshallOptions,
});

export const handler = (event: any, context: any, callback: any) => {
    const requestItems = buildRequestItems(event.Records);
    const requests = buildRequests(requestItems);
    
    Promise.all(requests)
      .then(() => callback(null, `Delivered ${event.Records.length} records`))
      .catch(callback);
};

const buildRequestItems = (records: any) => {
  return records.map((record: any) => {
    const json = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
    const item = JSON.parse(json);
    console.log(item)
  
    return {
      PutRequest: {
        Item: item,
      },
    };
  });
}

const buildRequests = (requestItems: any) => {
  const requests = [];
  
  while (requestItems.length > 0) {
    const request = batchWrite(requestItems.splice(0, 25));
  
    requests.push(request);
  }
  
  return requests;
}

const batchWrite = async (requestItems: any, attempt = 0): Promise<any> => {
  const params: any = {
      RequestItems: {
        [tableName]: requestItems 
      },
    };

  let delay = 0;
  
  if (attempt > 0) {
    delay = 50 * Math.pow(2, attempt);
  }
  
  return new Promise(function(resolve: any, reject: any) {
    setTimeout(function() {
      try {
        const data: any = ddbClient.send(new BatchWriteCommand(params));
        if (data.UnprocessedItems.hasOwnProperty(tableName)) {
          reject;
          return batchWrite(data.UnprocessedItems[tableName], attempt + 1);
        }
        resolve;
      } catch(e) {
        reject;
        return;
      }
    }, delay);
  });
}
