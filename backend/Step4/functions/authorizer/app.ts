import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthResponse, CustomAuthorizerEvent, PolicyDocument } from 'aws-lambda';
import jwt from 'jsonwebtoken';

const userPoolId: string = process.env.USERPOOLID!;
const appClientId: string = process.env.APPCLIENTID!;
const region: string = process.env.REGION!;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "id",
  clientId: appClientId
});

function generatePolicy (effect: string, accountId: string, apiId: string, stage: string): PolicyDocument {
  
  const resource = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*/*`
  
  if (effect) {
    const policyDocument: PolicyDocument = {
        'Version': '2012-10-17',
        'Statement': [
            {
            'Action': 'execute-api:Invoke',
            'Effect': effect,
            'Resource': resource
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
            'Resource': resource
            }
        ]
    }
    return policyDocument;      
  }
}

export const handler = async (event: CustomAuthorizerEvent): Promise<AuthResponse> => {
  const idToken: string = event.headers?.authorization!;
  console.log(JSON.stringify(event));
  const decoded = await jwt.decode(idToken, {'complete': true});
  let sub :string = 'me';
  if (decoded?.payload && decoded.payload?.sub) {
    sub = decoded.payload.sub as string;
  }
  try {
    // If the token is not valid, an error is thrown:
    const payload = await jwtVerifier.verify(idToken);
    console.log(JSON.stringify(payload));
    const accountId: string = event.requestContext?.accountId!;
    const apiId: string = event.requestContext?.apiId!;
    const stage: string = event.requestContext?.stage!;

    const policyDoc = generatePolicy('Allow', accountId, apiId, stage);
    console.log(JSON.stringify(policyDoc));
    return {
      principalId: sub,
      policyDocument: policyDoc
    } as AuthResponse
  } catch(e) {
    // API Gateway wants this *exact* error message, otherwise it returns 500 instead of 401:
    console.log(`error: ${JSON.stringify(e)}`)
    throw new Error("Unauthorized");
  }
};