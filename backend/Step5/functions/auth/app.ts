console.log('Loading function');

import { AuthResponse, CustomAuthorizerEvent, PolicyDocument } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import jwt from 'jsonwebtoken';

/*const jwt = require('jsonwebtoken');
const request = require('request');
const jwkToPem = require('jwk-to-pem');*/

const userPoolId: string = process.env.POOL_ID!; // '{REPLACE_WITH_YOUR_USER_POOL_ID}';
const appClientId: string = process.env.APPCLIENTID!;
const region: string  = process.env.REGION!; // e.g. us-east-1
const apiId: string  = process.env.API_ID!; //
const stage: string  = process.env.STAGE!; //

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "id",
  clientId: appClientId
});

const generatePolicy = (effect: string, arn: string): PolicyDocument => {
  
  if (effect) {
    const policyDocument: PolicyDocument = {
        'Version': '2012-10-17',
        'Statement': [
            {
            'Action': 'execute-api:Invoke',
            'Effect': effect,
            'Resource': arn
            }
        ]
    }
    return policyDocument;
  } else {
    const policyDocument: PolicyDocument = {
        'Version': '2012-10-17',
        'Statement': [
            {
            'Action': 'execute-api:Invoke',
            'Effect': 'Deny',
            'Resource': arn
            }
        ]
    }
    return policyDocument;      
  }
}
export const handler = async(event: any, context: any, callback: any) => {
  // Do not print the auth token unless absolutely necessary
  console.log(JSON.stringify(event));
  const token = event.queryStringParameters.access_token;
  let apiOptions: any = {};
  const tmp = event.methodArn.split(':');
  const apiGatewayArnTmp = tmp[5].split('/');
  const accountId: string = tmp[4];
  apiOptions.region = tmp[3];
  apiOptions.restApiId = apiGatewayArnTmp[0];
  apiOptions.stage = apiGatewayArnTmp[1];

  const apiId: string = event.requestContext?.apiId!;
  const stage: string = event.requestContext?.stage!;

  const decoded = await jwt.decode(token, {'complete': true});
  let sub :string = 'me';
  if (decoded?.payload && decoded.payload?.sub) {
    sub = decoded.payload.sub as string;
  }

  try {
    // If the token is not valid, an error is thrown:
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));

    // validate the incoming token
    // and produce the principal user identifier associated with the token
    
    let policyDoc = generatePolicy('Allow', event.methodArn);
    // policy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
    // finally, build the policy
    console.log(JSON.stringify(policyDoc));
    return {
      principalId: sub,
      policyDocument: policyDoc
    } as AuthResponse
  } catch(e) {
    console.log('cannot verify');
    context.fail('Unauthorized');
    throw new Error("Unauthorized");
  }
};

