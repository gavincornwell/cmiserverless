'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Retrieving all repositories...");

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