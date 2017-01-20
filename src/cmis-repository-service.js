'use strict';

let cmis = require('./cmis.js');
let utils = require('./lambda-utils.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Repository service received event: " + JSON.stringify(event, null, 2));

  // extract selector
  var selector = event.queryStringParameters.cmisselector;

  // extract repoId
  var repoId = event.pathParameters.repoId;

  // extract typeId
  var typeId = event.queryStringParameters.typeId;

  // define an inline callback function to use below
  var lambdaCallback = function(error, result) {
    if (error) {
     callback(error);
    } else {
     callback(null, utils.buildProxyResponseObject(result));
    }
  };

  // dispatch to appropriate function
  switch(selector) {
    case "typeDefinition":
      cmis.getTypeDefinition(repoId, typeId, lambdaCallback);
      break;
    case "typeDescendants":
      cmis.getTypeDescendants(repoId, typeId, lambdaCallback);
      break;
    default:
      callback(new Error("Unrecognised selector: " + selector));
  }
};