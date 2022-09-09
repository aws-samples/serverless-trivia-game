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

export const AWSConfig = {
        appName: 'Simple Trivia Service',
        region: '', //e.g. your region deployed in 'us-east-1',
    
    //Modify these values with outputs from the backend deployment step
        httpapi: '',// e.g. 'https://httpapid.execute-api.us-east-1.amazonaws.com'
        wsapi: '', //e.g. 'wss://wsid.execute-api.us-east-1.amazonaws.com/Prod',
        iotapi: '', //e.g. 'iotid-ats.iot.us-east-1.amazonaws.com',
        identityPoolId: '', //e.g. 'us-east-1:uuid-of-identity-pool',
        userPoolId: '', //e.g. 'us-east-1_userpoolid',
        appClientId: '', //e.g. 'xmtnge6gn6ob46tkq26345iwt',
        vapidPublicKey: '', //e.g. 'BKJLNm-RilHpXFTOitRqohNfeF3A_wrzd7ybhybWoWDgwcxaDIlcs1AsVxO7PbX3X7UlDYMZwKzAdu5ifRKAYpk'
    
    };