'use strict';

var AWS = require("aws-sdk");
AWS.config.update({
  region: "eu-central-1"
});

let cmisRepositoriesService = require('./cmis-repositories-service.js');

let context = {};
let event = {
    "resource": "/",
    "path": "/",
    "httpMethod": "GET",
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
        "resourcePath": "/",
        "httpMethod": "GET",
        "apiId": "xyz1234"
    },
    "body": null,
    "isBase64Encoded": false
};

// run the tests
console.log("Running repositories tests...");

// retrieve repositories
cmisRepositoriesService.handler(event, context, function(error, result) {
  if (error) {
    console.error("Failed to retrieve repositories: " + JSON.stringify(error, null, 2));
  } else {

    // ensure the status code is present and set to 200
    if (result.statusCode != "200") throw "TEST FAILED: expecting to receive 200 status code";

    var resultBody = JSON.parse(result.body);

    // ensure there's a repository with an id of "default"
    if (!resultBody.default) throw "TEST FAILED: expecting to receive default repository";

    // if we get this far the tests passed
    console.log("Tests Passed!");
  }
});