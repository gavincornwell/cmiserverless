'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Bootstrap service received event: " + JSON.stringify(event, null, 2));

  cmis.addRepository(event.repositoryId, event.baseUrl, callback);
};