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

const Config = {
        appName: 'Simple Trivia Service',
        region: '', //e.g. your region deployed in 'us-east-1',
    
    //Modify these values with outputs from the backend deployment step
        httpapi: 'https://54so02wj81.execute-api.us-east-1.amazonaws.com',// e.g. 'https://httpapid.execute-api.us-east-1.amazonaws.com'
        wsapi: 'wss://lypukyhejk.execute-api.us-east-1.amazonaws.com/Prod', //e.g. 'wss://wsid.execute-api.us-east-1.amazonaws.com/Prod',
        iotapi: 'a2uk107lvgk1u1-ats.iot.us-east-1.amazonaws.com', //e.g. 'iotid-ats.iot.us-east-1.amazonaws.com',
        identityPoolId: 'us-east-1:929a69ec-3113-4520-be9c-0bf705451472', //e.g. 'us-east-1:uuid-of-identity-pool',
        userPoolId: 'us-east-1_7YXjWGMVx', //e.g. 'us-east-1_userpoolid',
        appClientId: '1cal701ebaock95kmmi8qbmb2r', //e.g. 'xmtnge6gn6ob46tkq26345iwt',
        vapidPublicKey: 'BIQNeZsBeqBMDbdmR6HH-SxJyXL-rIM1Nyl_q9AKepnTYN_TLLM-QD9rwKugfLWYCBT9MNXsoDFMNDd17LRZsuM', //e.g. 'BKJLNm-RilHpXFTOitRqohNfeF3A_wrzd7ybhybWoWDgwcxaDIlcs1AsVxO7PbX3X7UlDYMZwKzAdu5ifRKAYpk'
    
    };
    
export default Config;