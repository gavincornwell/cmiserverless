'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Starting CMISServerless bootstrap process...");

  cmis.addRepository(event.repositoryId, event.baseUrl, function(error, result) {
    if (error) {
      callback(error);
    } else {
      var msg = "CMISServerless bootstrap process complete";
      console.log(msg);
      callback(null, msg);
    }
  });
};