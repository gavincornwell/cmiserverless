'use strict';

// setup dynamoDB to run locally
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
  endpoint: "http://localhost:8000"
});

let cmisBootstrapService = require('./cmis-bootstrap-service.js');
let cmisRepositoriesService = require('./cmis-repositories-service.js');
let cmisRepositoryService = require('./cmis-repository-service.js');
let doc = require('dynamodb-doc');
let dynamodb = new doc.DynamoDB();

let context = {};

/**
 * Setup test environment, create tables and add repository, if necessary
 */
exports.setup = function(callback) {
  dynamodb.listTables((error, data) => {
    if (error) {
      callback(data);
    } else {
      if (data.TableNames.length < 3) {

        console.log("Creating CMISRepositories table...");
        var repoParams = {
          TableName : "CMISRepositories",
          KeySchema: [
              { AttributeName: "repositoryId", KeyType: "HASH"},
          ],
          AttributeDefinitions: [
              { AttributeName: "repositoryId", AttributeType: "S" }
          ],
          ProvisionedThroughput: {
              ReadCapacityUnits: 10,
              WriteCapacityUnits: 10
          }
        };
        dynamodb.createTable(repoParams, function(error, data) {
          if (error) {
            callback(error);
          } else {

            console.log("Creating CMISTypes table...");
            var typesParams = {
              TableName : "CMISTypes",
              KeySchema: [
                  { AttributeName: "typeId", KeyType: "HASH"},
              ],
              AttributeDefinitions: [
                  { AttributeName: "typeId", AttributeType: "S" }
              ],
              ProvisionedThroughput: {
                  ReadCapacityUnits: 10,
                  WriteCapacityUnits: 10
              }
            };
            dynamodb.createTable(typesParams, function(error, data) {
              if (error) {
                callback(error);
              } else {

                console.log("Creating CMISObjects table...");
                var objectsParams = {
                  TableName : "CMISObjects",
                  KeySchema: [
                      { AttributeName: "cmis:objectId", KeyType: "HASH"},
                  ],
                  AttributeDefinitions: [
                      { AttributeName: "cmis:objectId", AttributeType: "S" }
                  ],
                  ProvisionedThroughput: {
                      ReadCapacityUnits: 10,
                      WriteCapacityUnits: 10
                  }
                };
                dynamodb.createTable(objectsParams, function(error, data) {
                  if (error) {
                    callback(error);
                  } else {

                    // call the CMIS bootstrap service
                    var event = {
                      "repositoryId": "default",
                      "baseUrl": "https://abcdef.api-gateway.amazon.com/dev"
                    };
                    cmisBootstrapService.handler(event, context, function(error, result) {
                      if (error) {
                        callback(error);
                      } else {
                        callback(null, "Setup completed successfully");
                      }
                    });
                  }
                });
              }
            });
          }
        });
      } else {
        callback(null, {});
      }
    }
  });
};

// setup environment
console.log("Setting up test environment...");
exports.setup((error, result) => {
  if (error) {
    console.error("Test setup failed: " + JSON.stringify(error, null, 2));
  } else {

    // run the tests
    console.log("Running tests...");

    // get all repositories
    cmisRepositoriesService.handler({}, context, function(error, result) {
      if (error) {
        console.error("Failed to retrieve repositories: " + JSON.stringify(error, null, 2));
      } else {

        // ensure there's a repository with an id of "default"
        if (!result.default) throw "TEST FAILED: default repository is missing";

        // get the cmis:folder type definition for the default repository
        var event = {
          "cmisselector": "typeDefinition",
          "repoId": "default",
          "typeId": "cmis:folder"
        };
        cmisRepositoryService.handler(event, context, function(error, result) {
            if (error) {
              console.error("Failed to retrieve type definition: " + JSON.stringify(error, null, 2));
            } else {

                // ensure the correct type definition was returned
                if (!result.typeId === "cmis:folder") throw "TEST FAILED: incorrect type definition returned";
                if (!result.displayName === "Folder") throw "TEST FAILED: incorrect type display name returned";

                console.log("Tests Passed!");
            }
        });
      }
    });
  }
});