'use strict';

let utils = require('./lambda-utils.js');

console.log("Running tests...");

let testEvent = {
    "body": "cmisaction=createFolder&propertyId%5B0%5D=cmis%3Aname&propertyValue%5B0%5D=a1e68d15-c5eb-45d7-bf4b-b5e6884f4254&propertyId%5B1%5D=cmis%3AobjectTypeId&propertyValue%5B1%5D=cmis%3Afolder&propertyId%5B2%5D=cmis%3Adescription&propertyValue%5B2%5D=Folder%20created%20with%20Postman&succinct=true"
};

var params = utils.parseUrlEncodedBody(testEvent);
if (params.cmisaction === undefined) throw "TEST FAILED: expecting to receive a cmisaction parameter";

var properties = utils.parseProperties(params);
if (properties["cmis:name"] === undefined) throw "TEST FAILED: expecting to receive a cmis:name property";

// TODO: write tests for other parse functions

console.log("Tests passed!");