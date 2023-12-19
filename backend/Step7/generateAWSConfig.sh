#!/bin/bash

iot=$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --region $1 | jq .endpointAddress -r)
rest=$(aws cloudformation list-exports | jq '.Exports[] | select (.Name == "STS-APIGWURI").Value' -r)
ws=$(aws cloudformation list-exports | jq '.Exports[] | select (.Name == "STS-WSURI").Value' -r)
idpool=$(aws cloudformation list-exports | jq '.Exports[] | select (.Name == "STS-IdentityPoolId").Value' -r)
userpool=$(aws cloudformation list-exports | jq '.Exports[] | select (.Name == "STS-UserPoolId").Value' -r)
appclient=$(aws cloudformation list-exports | jq '.Exports[] | select (.Name == "STS-AppClientId").Value' -r)

file="./AWSConfig.js"
rm $file
echo "/* file generated from generateAWSConfig.sh */" >> $file

echo " export const AWSConfig = {" >> $file
echo " appName: 'Simple Trivia Service', " >> $file
echo " region: '$1', " >> $file
echo " httpapi: '$rest', " >> $file
echo " wsapi: '$ws', " >> $file
echo " iotapi: '$iot'," >> $file
echo " identityPoolId: '$idpool', " >> $file
echo " userPoolId: '$userpool', " >> $file
echo " appClientId: '$appclient', " >> $file
echo " };" >> $file

cat $file

