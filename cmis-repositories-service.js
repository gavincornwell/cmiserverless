'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Repositories service received event: " + JSON.stringify(event, null, 2));

  cmis.getRepositories(function(error, result) {
    if (error) {
      callback(error);
    } else {
      // create an object with a property per repository
      var repos = {};
      result.forEach(function(item) {
          repos[item.repositoryId] = item;
      });
      callback(null, repos);
    }
  });
};