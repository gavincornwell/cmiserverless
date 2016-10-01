# Welcome to CMIServerless
This project implements a CMIS 1.1 compliant server on AWS using a serverless architecture and leveraging the [Serverless](https://serverless.com) framework. 

## Pre-requisites
* [Node.js](https://nodejs.org)
* [AWS SDK](https://aws.amazon.com/sdk-for-node-js/) installed and configured
* [Serverless](https://serverless.com/framework/docs/guide/) installed globally

## Setup
    npm install node-uuid
    serverless deploy --verbose
    curl -X POST -H "Content-Type: application/json" -d '{}' "https://<apiId>.execute-api.<region>.amazonaws.com/dev/bootstrap"

Replace **apiId** with the ID API Gateway generates for you and replace **region** with the AWS region you deployed to i.e. us-east-1.

Manually map **cmiserverless-dev-repositories** lambda function to GET / in API Gateway.

## Running Tests

To run the tests DyanmoDB is required, follow the [instructions](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) to download and run it locally.

Once DynamoDB is running do the following:

    npm install aws_sdk
    npm install dynamodb-doc
    node test.js