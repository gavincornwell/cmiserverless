'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Object service received event: " + JSON.stringify(event, null, 2));

  // extract repoId
  var repoId = event.repoId;

  // extract objectId
  var objectId = event.objectId;

  // extract selector
  var selector = event.cmisselector;

  // create options object
  var options = cmis.parseEvent(event);

  // dispatch to appropriate function
  if (selector) {

    switch(selector) {
      case "object":
        cmis.getObject(repoId, objectId, options, callback);
        break;
      case "children":
        cmis.getChildren(repoId, objectId, options, callback);
        break;
      case "content":
        cmis.getContentStream(repoId, objectId, callback);
        break;
      default:
        callback(new Error("Unrecognised selector: " + selector));
    }
  } else {
    // extract action
    var action = event.cmisaction;

    // create properties objects
    var properties = cmis.parseProperties(event);
    var name = properties["cmis:name"];
    var description = properties["cmis:description"];

    switch(action) {
      case "createFolder":
        cmis.addFolderObject(repoId, objectId, name, description, options, callback);
        break;
      case "createDocument":
        cmis.addDocumentObject(repoId, objectId, name, description, event.content, event.mimeType, options, callback);
        break;
      default:
        callback(new Error("Unrecognised action: " + action));
    }
  }
};