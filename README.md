# Welcome to CMIServerless
This project implements a CMIS 1.1 compliant server on AWS using a serverless architecture. 

## Pre-requisites
* [Node.js](https://nodejs.org)
* [AWS SDK](https://aws.amazon.com/sdk-for-node-js/) installed and configured

## Setup
    cd src
    npm install node-uuid
    
## Deploy
    aws cloudformation package --template-file sam-template.yaml --s3-bucket <bucket-name> --output-template-file sam-deploy.yaml
    aws cloudformation deploy --template-file sam-deploy.yaml --stack-name cmiserverless --capabilities CAPABILITY_IAM
    
## Testing
    
Use the [Postman](https://www.getpostman.com) collection in the test/postman folder to test the deployment.
   
## Running Tests Locally
    cd src
    npm install aws-sdk
    npm install dynamodb-doc
    node cmis-test.js
    
NOTE: You'll need to remove the aws-sdk and dynamodb-doc modules before performing subsequent deployments.