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

import { AWSConfig } from './AWSConfig'
import { CognitoUser, CognitoUserAttribute, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { auth } from 'aws-iot-device-sdk-v2';

export let userPool = new CognitoUserPool({
        UserPoolId: AWSConfig.userPoolId,
        ClientId: AWSConfig.appClientId
    });

let cognitoUser;

    
//AWS.config.region = AWSConfig.region;
export class AWSCognitoCredentialsProvider extends auth.CredentialsProvider{

    constructor(options, expire_interval_in_ms)
    {
        super();
        this.options = options;

        setInterval(async ()=>{
            await this.refreshCredentials();
        },expire_interval_in_ms?? 3600*1000);
    }

    getCredentials() {
        return {
            aws_access_id: this.cachedCredentials?.accessKeyId ?? "",
            aws_secret_key: this.cachedCredentials?.secretAccessKey ?? "",
            aws_sts_token: this.cachedCredentials?.sessionToken,
            aws_region: this.options.Region
        }
    }

    async refreshCredentials()  {
        this.cachedCredentials = await fromCognitoIdentityPool({
            // Required. The unique identifier for the identity pool from which an identity should be
            // retrieved or generated.
            identityPoolId: AWSConfig.identityPoolId,
            clientConfig: { region: AWSConfig.region },
        })();
    }
}

function authenticateUser(uid, pwd) {
    var promise = new Promise(function(resolve, reject) {
        const authenticationDetails = new AuthenticationDetails({
            Username: uid,
            Password: pwd
        });
        cognitoUser = new CognitoUser({
            Username: uid,
            Pool: userPool
        });
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                resolve(result);
            },
            onFailure: (error) => {
                reject(error);
            }
        });
    });
    return promise;
}

function buildUserObject(username) {
    var promise = new Promise((resolve, reject) => {
        cognitoUser.getSession((sessionErr) => {
            if(sessionErr) {
                reject(sessionErr);
            }
            cognitoUser.getUserAttributes((err, result) => {
                if (err) {
                  reject(err);
                }
                const user = {};
                for (let i = 0; i < result.length; i += 1) {
                  user[result[i].getName()] = result[i].getValue();
                }
                user.username = username;
                resolve(user);
            });
        });
    });
    return promise
}

function returnSession(cognitoUserSession) {
    return new Promise((resolve) => {
        resolve(cognitoUserSession);
    });
}

function loginUser(username, password) {
    
    return new Promise(function(resolve, reject) {
        var promise = authenticateUser(username, password);
        promise
        .then(function(cognitoUserSession){
            const promise2 = buildUserObject(username);
            const promise3 = returnSession(cognitoUserSession);
            return Promise.all([promise2, promise3]); //promise1
        })
        .then(function(values){
            //const awsCredentials = values[0];
            const userObj = values[0];
            const cognitoSession = values[1];
            const userData = { userObj, cognitoSession}; //awsCredentials,
            resolve(userData);
        })
        .catch(function(err){
            reject(err);
        });
    });
}

export const login = function(username, password) {
    return new Promise(function(resolve, reject) {
        loginUser(username, password)
        .then(function(userdata){
            resolve(userdata);
        })
        .catch(function(err){
            console.error(err);
            reject(err.message || JSON.stringify(err));
        });
    });
}

export const signup = async function(username, password, email) {
    return new Promise(function(resolve, reject){
        let attributeList = [];
        let attributeEmail = new CognitoUserAttribute({ Name: 'email', Value: email });
        attributeList.push(attributeEmail);
        userPool.signUp(username, password, attributeList, null, function(err, result){        
            if(err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                cognitoUser = result.user;
                resolve(cognitoUser.getUsername());
            }
        });
    });
}

export const triggerforgotpw = function(username) {
    return new Promise(function(resolve, reject){
        var userData = {
            Username: username,
            Pool: userPool,
        };
        cognitoUser = new CognitoUser(userData);    
        cognitoUser.forgotPassword({
            onSuccess: function(data) {
                // successfully initiated reset password request
                resolve(data)
            },
            onFailure: function(err) {
                console.error(err.message || JSON.stringify(err));
                reject(err);
            }
        });
    });
}

export const resetforgotpw = function(username, code, password) {

    return new Promise(function(resolve, reject){
        var userData = {
            Username: username,
            Pool: userPool,
        };
        cognitoUser = new CognitoUser(userData);    
        cognitoUser.confirmPassword(code, password, {
            onSuccess() {
                resolve(true);
            },
            onFailure(err) {
                reject(err);
            },
        });
    });
}

export const cognitosignout = async function (){
    if(cognitoUser) {
        await cognitoUser.globalSignOut({
            onSuccess() {
                console.log('successfully logged out');
                return true;
            },
            onFailure(err) {
                console.error(JSON.stringify(err));
                return false;
            }
        });
    }
}