'use strict';

var AWS = require("aws-sdk");
AWS.config.update({
  region: "eu-central-1"
});

let cmisObjectService = require('./cmis-object-service.js');

let context = {};
let rootFolderEvent = {
    "resource": "/{repoId}/object",
    "path": "/default/object",
    "httpMethod": "GET",
    "headers": null,
    "queryStringParameters": {
        "cmisselector": "object",
        "objectId": "da5b6a5c-f15c-43bd-940d-ff5293ab6f84"
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
        "resourcePath": "/{repoId}/object",
        "httpMethod": "GET",
        "apiId": "xyz1234"
    },
    "body": null,
    "isBase64Encoded": false
};

// run the tests
console.log("Running object tests...");

// retrieve root folder
cmisObjectService.handler(rootFolderEvent, context, function(error, result) {
  if (error) {
    console.error("Failed to retrieve root folder: " + JSON.stringify(error, null, 2));
  } else {

    // ensure the status code is present and set to 200
    if (result.statusCode != "200") throw "TEST FAILED: expecting to receive 200 status code";

    var resultBody = JSON.parse(result.body);

    // ensure there's a properties object
    if (resultBody.properties === undefined) throw "TEST FAILED: expecting to receive a properties object";

    // ensure there's a cmis:objectId property returned
    if (!resultBody.properties["cmis:objectId"]) throw "TEST FAILED: expecting to receive cmis:objectId property";

    // ensure the correct object has been returned
    if (!resultBody.properties["cmis:objectId"].value === "da5b6a5c-f15c-43bd-940d-ff5293ab6f84") throw "TEST FAILED: expecting to receive requested object";

    // if we get this far the tests passed
    console.log("Retrieve root folder tests passed!");
  }
});

let createFolderEvent = {
    "resource": "/{repoId}/object",
    "path": "/default/object",
    "httpMethod": "POST",
    "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    "queryStringParameters": {
        "objectId": "da5b6a5c-f15c-43bd-940d-ff5293ab6f84"
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
        "resourcePath": "/{repoId}/object",
        "httpMethod": "POST",
        "apiId": "xyz1234"
    },
    "body": "cmisaction=createFolder&propertyId[0]=cmis:name&propertyValue[0]=16312d1f-fa80-4b3b-8fca-2705922052aa&propertyId[1]=cmis:objectTypeId&propertyValue[1]=cmis:folder&propertyId[2]=cmis:description&propertyValue[2]=Folder created with tests&succinct=true",
    "isBase64Encoded": false
};

// create folder
cmisObjectService.handler(createFolderEvent, context, function(error, result) {
  if (error) {
    console.error("Failed to create folder: " + JSON.stringify(error, null, 2));
  } else {

    // ensure the status code is present and set to 201
    if (result.statusCode != "201") throw "TEST FAILED: expecting to receive 201 status code";

    var resultBody = JSON.parse(result.body);

    // ensure there's a properties object
    if (resultBody.properties === undefined) throw "TEST FAILED: expecting to receive a properties object";

    // ensure there's a cmis:objectId property returned
    if (!resultBody.properties["cmis:objectId"]) throw "TEST FAILED: expecting to receive cmis:objectId property";

    // ensure a value is returned
    if (resultBody.properties["cmis:objectId"].value === undefined) throw "TEST FAILED: expecting to receive value object";

    // if we get this far the tests passed
    console.log("Create folder tests passed!");
  }
});