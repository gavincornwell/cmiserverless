'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Repository service received event: " + JSON.stringify(event, null, 2));

  // extract selector
  var selector = event.cmisselector;

  // extract repoId
  var repoId = event.repoId;

  // extract typeId
  var typeId = event.typeId;

  // dispatch to appropriate function
  switch(selector) {
    case "typeDefinition":
      cmis.getTypeDefinition(repoId, typeId, callback);
      break;
    case "typeDescendants":
      cmis.getTypeDescendants(repoId, typeId, callback);
      break;
    default:
      callback(new Error("Unrecognised selector: " + selector));
  }
};