'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Starting CMISServerless bootstrap process...");

  cmis.addRepository(event.repositoryId, event.baseUrl, function(error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, "CMISServerless bootstrap process complete");
    }
  });
};