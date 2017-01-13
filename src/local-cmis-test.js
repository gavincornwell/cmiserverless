'use strict';

// setup dynamoDB to run locally
var AWS = require("aws-sdk");
AWS.config.update({
  region: "eu-central-1"
});

let uuid = require('node-uuid');

let cmisBootstrapService = require('./cmis-bootstrap-service.js');
let cmisRepositoriesService = require('./cmis-repositories-service.js');
let cmisRepositoryService = require('./cmis-repository-service.js');
let cmisObjectService = require('./cmis-object-service.js');

let context = {};

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

                        // retrieve the content of the new document
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

                            // get children of new folder and verify the new document is present
                            var event = {
                              "cmisselector": "children",
                              "repoId": "default",
                              "objectId": newFolderId,
                              "succinct": true
                            };
                            cmisObjectService.handler(event, context, function(error, result) {
                              if (error) {
                                console.error("Failed to get children: " + JSON.stringify(error, null, 2));
                              } else {

                                if (result.objects === undefined) throw "TEST FAILED: expecting an objects property";
                                if (result.objects.length != 1) throw "TEST FAILED: expecting an array with 1 entry";
                                if (result.objects[0].object.succinctProperties["cmis:objectId"] != newDocumentId) {
                                  throw "TEST FAILED: expecting the child object to be the document just created";
                                }

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