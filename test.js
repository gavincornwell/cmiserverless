'use strict';

// setup dynamoDB to run locally
var AWS = require("aws-sdk");
//AWS.config.update({
//  region: "us-east-1",
//  endpoint: "http://localhost:8000"
//});
AWS.config.update({
  region: "us-east-1"
});

let uuid = require('node-uuid');

let cmisBootstrapService = require('./cmis-bootstrap-service.js');
let cmisRepositoriesService = require('./cmis-repositories-service.js');
let cmisRepositoryService = require('./cmis-repository-service.js');
let cmisObjectService = require('./cmis-object-service.js');
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
                      "baseUrl": "https://localhost.execute-api.us-east-1.amazonaws.com/dev"
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
        if (!result.default) throw "TEST FAILED: expecting to receive default repository";

        // grab the root folder id
        var rootFolderId = result.default.rootFolderId;

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
            if (!result.typeId === "cmis:folder") throw "TEST FAILED: expecting type definition for cmis:folder";
            if (!result.displayName === "Folder") throw "TEST FAILED: expecting display name of 'Folder'";

            // get the type descendants for cmis:folder
            var event = {
              "cmisselector": "typeDescendants",
              "repoId": "default",
              "typeId": "cmis:folder"
            };
            cmisRepositoryService.handler(event, context, function(error, result) {
              if (error) {
                console.error("Failed to retrieve type descendants: " + JSON.stringify(error, null, 2));
              } else {

                // ensure an empty array is returned
                if (result.length != 0) throw "TEST FAILED: expecting an empty array";

                // retrieve the root folder object
                var event = {
                  "cmisselector": "object",
                  "repoId": "default",
                  "objectId": rootFolderId,
                  "includeAllowableActions": true
                };
                cmisObjectService.handler(event, context, function(error, result) {
                  if (error) {
                    console.error("Failed to retrieve root folder: " + JSON.stringify(error, null, 2));
                  } else {

                    // check we got the root folder back
                    if (!result.properties["cmis:name"].value === "Root Folder") throw "TEST FAILED: expecting name of 'Root Folder'";

                    // check we got the allowableOperations back
                    if (!result.allowableActions.canCreateFolder) throw "TEST FAILED: expecting canCreateFolder to be true";

                    // create a folder in the root of the repository
                    var newFolderId = uuid.v4();
                    var event = {
                      "cmisaction": "createFolder",
                      "repoId": "default",
                      "objectId": rootFolderId,
                      "propertyId[0]": "cmis:name",
                      "propertyValue[0]": newFolderId,
                      "propertyId[1]": "cmis:objectTypeId",
                      "propertyValue[1]": "cmis:folder",
                      "propertyId[2]": "cmis:description",
                      "propertyValue[2]": "Test Folder",
                      "succinct": true
                    };
                    cmisObjectService.handler(event, context, function(error, result) {
                      if (error) {
                        console.error("Failed to add folder: " + JSON.stringify(error, null, 2));
                      } else {

                        // check we got the new folder back
                        if (result.succinctProperties["cmis:description"] != "Test Folder") throw "TEST FAILED: expecting description of 'Test Folder'";
                        if (result.succinctProperties["cmis:name"] != newFolderId) throw "TEST FAILED: expecting name of '" + newFolderId + "'";
                        var newPath = "/" + newFolderId;
                        if (result.succinctProperties["cmis:path"] != newPath) throw "TEST FAILED: expecting path of '" + newPath + "'";

                        // add document to new folder
                        var newDocName = uuid.v4() + ".txt";
                        var content = "This is some test content";
                        var event = {
                          "cmisaction": "createDocument",
                          "repoId": "default",
                          "objectId": newFolderId,
                          "propertyId[0]": "cmis:name",
                          "propertyValue[0]": newDocName,
                          "propertyId[1]": "cmis:objectTypeId",
                          "propertyValue[1]": "cmis:document",
                          "propertyId[2]": "cmis:description",
                          "propertyValue[2]": "Test Document",
                          "content": content,
                          "mimeType": "text/plain",
                          "succinct": true
                        };
                        cmisObjectService.handler(event, context, function(error, result) {
                          if (error) {
                            console.error("Failed to add document: " + JSON.stringify(error, null, 2));
                          } else {

                            if (result.succinctProperties["cmis:contentStreamFileName"] != newDocName) {
                              throw "TEST FAILED: expecting content stream name of '" + newDocName + "'";
                            }

                            if (result.succinctProperties["cmis:contentStreamMimeType"] != "text/plain") {
                              throw "TEST FAILED: expecting content stream mimetype of 'text/plain'";
                            }

                            var newDocumentId = result.succinctProperties["cmis:objectId"];
                            var event = {
                              "cmisselector": "content",
                              "repoId": "default",
                              "objectId": newDocumentId
                            };
                            cmisObjectService.handler(event, context, function(error, result) {
                              if (error) {
                                console.error("Failed to get content: " + JSON.stringify(error, null, 2));
                              } else {

                                if (result != content) throw "TEST FAILED: expecting content of '" + content + "'";

                                // TODO: get children of new folder

                                // if we get this far the tests passed
                                console.log("Tests Passed!");
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }
});