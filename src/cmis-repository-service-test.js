'use strict';

var AWS = require("aws-sdk");
AWS.config.update({
  region: "eu-central-1"
});

let cmisRepositoryService = require('./cmis-repository-service.js');

let context = {};
let typeDefinitionEvent = {
    "resource": "/{repoId}",
    "path": "/default",
    "httpMethod": "GET",
    "headers": null,
    "queryStringParameters": {
        "cmisselector": "typeDefinition",
        "typeId": "cmis:folder"
    },
    "pathParameters": {
        "repoId": "default"
    },
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
        "resourcePath": "/{repoId}",
        "httpMethod": "GET",
        "apiId": "xyz1234"
    },
    "body": null,
    "isBase64Encoded": false
};

// run the tests
console.log("Running repository tests...");

// retrieve type definition
cmisRepositoryService.handler(typeDefinitionEvent, context, function(error, result) {
  if (error) {
    console.error("Failed to retrieve type definition: " + JSON.stringify(error, null, 2));
  } else {

    // ensure the status code is present and set to 200
    if (result.statusCode != "200") throw "TEST FAILED: expecting to receive 200 status code";

    var resultBody = JSON.parse(result.body);

    // ensure there's a typeId property set to "cmis:folder"
    if (!resultBody.typeId == "cmis:folder") throw "TEST FAILED: expecting to receive typeId of cmis:folder";

    // ensure there's a property definition named cmis:objectId
    if (!resultBody.propertyDefinitions["cmis:objectId"]) throw "TEST FAILED: expecting to receive cmis:objectId property definition";

    // if we get this far the tests passed
    console.log("Type definition tests passed!");
  }
});

let typeDescendantsEvent = {
   "resource": "/{repoId}",
   "path": "/default",
   "httpMethod": "GET",
   "headers": null,
   "queryStringParameters": {
       "cmisselector": "typeDescendants",
       "typeId": "cmis:folder"
   },
   "pathParameters": {
       "repoId": "default"
   },
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
       "resourcePath": "/{repoId}",
       "httpMethod": "GET",
       "apiId": "xyz1234"
   },
   "body": null,
   "isBase64Encoded": false
};

// retrieve type descendants
cmisRepositoryService.handler(typeDescendantsEvent, context, function(error, result) {
  if (error) {
    console.error("Failed to retrieve type descendants: " + JSON.stringify(error, null, 2));
  } else {

    // ensure the status code is present and set to 200
    if (result.statusCode != "200") throw "TEST FAILED: expecting to receive 200 status code";

    var resultBody = JSON.parse(result.body);

    // ensure an empty array is returned
    if (!resultBody.length == 0) throw "TEST FAILED: expecting to receive an empty array";

    // if we get this far the tests passed
    console.log("Type descendants tests passed!");
  }
});

let invalidSelectorEvent = {
   "resource": "/{repoId}",
   "path": "/default",
   "httpMethod": "GET",
   "headers": null,
   "queryStringParameters": {
       "cmisselector": "invalid",
       "typeId": "cmis:folder"
   },
   "pathParameters": {
       "repoId": "default"
   },
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
       "resourcePath": "/{repoId}",
       "httpMethod": "GET",
       "apiId": "xyz1234"
   },
   "body": null,
   "isBase64Encoded": false
};

// test invalid selector
cmisRepositoryService.handler(invalidSelectorEvent, context, function(error, result) {
  if (error) {
    console.error(error);
    console.log("Invalid selector tests passed!");
  } else {
    throw "TEST FAILED: expecting to receive an error";
  }
});