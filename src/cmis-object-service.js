'use strict';

let cmis = require('./cmis.js');
let utils = require('./lambda-utils.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Object service received event: " + JSON.stringify(event, null, 2));

  // extract repoId
  var repoId = event.pathParameters.repoId;

  // extract objectId
  var objectId = event.queryStringParameters.objectId;

  // extract selector
  var selector = event.queryStringParameters.cmisselector;

  // create options object
  var options = utils.parseOptions(event);

  // define an inline callback function to use for GET
  var lambdaCallbackGet = function(error, result) {
    if (error) {
     callback(error);
    } else {
     callback(null, utils.buildProxyResponseObject(result));
    }
  };

  // define an inline callback function to use for POST
  var lambdaCallbackPost = function(error, result) {
    if (error) {
     callback(error);
    } else {
     callback(null, utils.buildProxyResponseObject(result, 201));
    }
  };

  // dispatch to appropriate function
  if (selector) {

    switch(selector) {
      case "object":
        cmis.getObject(repoId, objectId, options, lambdaCallbackGet);
        break;
      case "children":
        cmis.getChildren(repoId, objectId, options, lambdaCallbackGet);
        break;
      case "content":
        cmis.getContentStream(repoId, objectId, lambdaCallbackGet);
        break;
      default:
        callback(new Error("Unrecognised selector: " + lambdaCallbackGet));
    }
  } else {

    // parse the url-encoded body
    var params = utils.parseUrlEncodedBody(event);

    // extract action
    var action = params.cmisaction;

    // create properties objects
    var properties = utils.parseProperties(params);

    var name = properties["cmis:name"];
    var description = properties["cmis:description"];

    switch(action) {
      case "createFolder":
        cmis.addFolderObject(repoId, objectId, name, description, options, lambdaCallbackPost);
        break;
      case "createDocument":
        cmis.addDocumentObject(repoId, objectId, name, description, event.content, event.mimeType, options, lambdaCallbackPost);
        break;
      default:
        callback(new Error("Unrecognised action: " + action));
    }
  }
};