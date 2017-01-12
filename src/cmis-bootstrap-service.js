'use strict';

let cmis = require('./cmis.js');

// main entry point
module.exports.handler = (event, context, callback) => {

  console.log("Bootstrap service received event: " + JSON.stringify(event, null, 2));

  // get repositoryId from body
  var repositoryId = JSON.parse(event.body).repositoryId;

  // construct the baseUrl
  // TODO: extract the region into an environment variable
  var baseUrl = "https://" + event.requestContext.apiId + ".execute-api.eu-central-1.amazonaws.com/" + event.requestContext.stage;

  cmis.addRepository(repositoryId, baseUrl, function(error, data) {
    if (error) {
      callback(error);
    } else {
      var response = {
        statusCode: 201,
        body: JSON.stringify(data)
      };

      console.log("Bootstrap service result: " + JSON.stringify(response, null, 2));
      callback(null, response);
    }
  });
};