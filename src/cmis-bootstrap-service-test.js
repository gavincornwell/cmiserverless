'use strict';

var AWS = require("aws-sdk");
AWS.config.update({
  region: "eu-central-1"
});

let cmisBootstrapService = require('./cmis-bootstrap-service.js');

let context = {};
let event = {
  "resource": "/bootstrap",
  "path": "/bootstrap",
  "httpMethod": "POST",
  "headers": null,
  "queryStringParameters": null,
  "pathParameters": null,
  "stageVariables": null,
  "requestContext": {
    "accountId": "0123456789",
    "resourceId": "abcd9876",
    "stage": "test-invoke-stage",
    "requestId": "test-invoke-request",
    "identity": {
      "cognitoIdentityPoolId": null,
      "accountId": "0123456789",
      "cognitoIdentityId": null,
      "caller": "ABCDEFGHIJ",
      "apiKey": "test-invoke-api-key",
      "sourceIp": "test-invoke-source-ip",
      "accessKey": "ABCDEFGHIJ",
      "cognitoAuthenticationType": null,
      "cognitoAuthenticationProvider": null,
      "userArn": "arn:aws:iam::0123456789:user/adminuser",
      "userAgent": "Apache-HttpClient/4.5.x (Java/1.8.0_102)",
      "user": "ABCDEFGHIJ"
    },
    "resourcePath": "/bootstrap",
    "httpMethod": "POST",
    "apiId": "xyz1234"
  },
  "body": "{\n    \"repositoryId\": \"default\"\n}",
  "isBase64Encoded": false
};

// run the tests
console.log("Running bootstrap tests...");

// bootstrap
cmisBootstrapService.handler(event, context, function(error, result) {
  if (error) {
    console.error("Failed to bootstrap: " + JSON.stringify(error, null, 2));
  } else {
    // TODO: test the response is as expected
    console.log("Result: " + JSON.stringify(result, null, 2));
  }
});