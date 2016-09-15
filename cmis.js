'use strict';

let uuid = require('node-uuid');
let doc = require('dynamodb-doc');
let dynamodb = new doc.DynamoDB();

// constants
let REPOSITORIES_TABLE_NAME = "CMISRepositories";
let TYPES_TABLE_NAME = "CMISTypes";
let OBJECTS_TABLE_NAME = "CMISObjects";

/**
 * Retrieves a repository from the database
 */
exports.getRepository = function(repoId, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId and baseUrl have been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  console.log("Retrieving repository with id: " + repoId);

  // retrieve the type definition from the database
  var params = {
    TableName : REPOSITORIES_TABLE_NAME,
    Key: {
      "repositoryId": repoId
    }
  }

  dynamodb.getItem(params, function(error, result) {
      if (error) {
        callback(error);
      } else {
        callback(null, result.Item);
      }
  });
}

/**
 * Adds a repository to the database
 */
exports.addRepository = function(repoId, baseUrl, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function")) {
    throw "callback is not a function";
  }

  // check repoId and baseUrl have been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }
  if (!baseUrl || baseUrl === null) {
    callback("baseUrl parameter is mandatory", null);
    return;
  }

  // TODO: use conditional put to stop multiple root folders being added

  exports.addFolderObject("Root Folder", "Root Folder", "/", function(error, result) {
    if (error) {
      callback(error);
    } else {
      var rootFolderId = result["cmis:objectId"];
      var repositoryUrl = baseUrl + "/default";
      var rootFolderUrl = repositoryUrl + "/object";

      // construct the repository object
      var repositoryObject = {
        repositoryId: repoId,
        repositoryName: "CMIServerless",
        repositoryDescription: "A servless CMIS 1.1 browser binding compliant server",
        vendorName: "Gavin Cornwell",
        productName: "CMIServerless",
        productVersion: "0.1",
        cmisVersionSupported: "1.1",
        capabilities:{
            capabilityGetDescendants: false,
            capabilityGetFolderTree: false,
            capabilityOrderBy: "none",
            capabilityContentStreamUpdatability: "anytime",
            capabilityChanges: "none",
            capabilityRenditions: "none",
            capabilityMultifiling: false,
            capabilityUnfiling: false,
            capabilityVersionSpecificFiling: false,
            capabilityPWCUpdatable: false,
            capabilityPWCSearchable: false,
            capabilityAllVersionsSearchable: false,
            capabilityQuery: "none",
            capabilityJoin: "none",
            capabilityACL: "none"
        },
        repositoryUrl: repositoryUrl,
        rootFolderUrl: rootFolderUrl,
        rootFolderId: rootFolderId,
        changesIncomplete: false
      }

      console.log("Adding repository object: " + JSON.stringify(repositoryObject, null, 2));

      // insert repo into DynamoDB
      var repoParams = {
        TableName: REPOSITORIES_TABLE_NAME,
        Item: repositoryObject
      };
      dynamodb.putItem(repoParams, function(error, result) {
        if (error) {
          callback(error);
        } else {

          // add the folder type definition
          var folderTypeObject = {
            "baseId": "cmis:folder",
            "controllableACL": true,
            "controllablePolicy": true,
            "creatable": true,
            "description": "Folder",
            "displayName": "Folder",
            "fileable": true,
            "fulltextIndexed": false,
            "includedInSupertypeQuery": true,
            "localName": "cmis:folder",
            "localNamespace": "http://apache.org",
            "propertyDefinitions": {
             "cmis:allowedChildObjectTypeIds": {
               "cardinality": "multi",
               "defaultValue": [],
               "description": "Allowed Child Object Type Ids",
               "displayName": "Allowed Child Object Type Ids",
               "id": "cmis:allowedChildObjectTypeIds",
               "inherited": false,
               "localName": "cmis:allowedChildObjectTypeIds",
               "orderable": false,
               "propertyType": "id",
               "queryable": false,
               "queryName": "cmis:allowedChildObjectTypeIds",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:baseTypeId": {
               "cardinality": "single",
               "description": "Base Type Id",
               "displayName": "Base Type Id",
               "id": "cmis:baseTypeId",
               "inherited": false,
               "localName": "cmis:baseTypeId",
               "orderable": false,
               "propertyType": "id",
               "queryable": true,
               "queryName": "cmis:baseTypeId",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:changeToken": {
               "cardinality": "single",
               "description": "Change Token",
               "displayName": "Change Token",
               "id": "cmis:changeToken",
               "inherited": false,
               "localName": "cmis:changeToken",
               "orderable": false,
               "propertyType": "string",
               "queryable": false,
               "queryName": "cmis:changeToken",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:createdBy": {
               "cardinality": "single",
               "description": "Created By",
               "displayName": "Created By",
               "id": "cmis:createdBy",
               "inherited": false,
               "localName": "cmis:createdBy",
               "orderable": true,
               "propertyType": "string",
               "queryable": true,
               "queryName": "cmis:createdBy",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:creationDate": {
               "cardinality": "single",
               "description": "Creation Date",
               "displayName": "Creation Date",
               "id": "cmis:creationDate",
               "inherited": false,
               "localName": "cmis:creationDate",
               "orderable": true,
               "propertyType": "datetime",
               "queryable": true,
               "queryName": "cmis:creationDate",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:description": {
               "cardinality": "single",
               "description": "Description",
               "displayName": "Description",
               "id": "cmis:description",
               "inherited": false,
               "localName": "cmis:description",
               "orderable": false,
               "propertyType": "string",
               "queryable": false,
               "queryName": "cmis:description",
               "required": false,
               "updatability": "readwrite"
             },
             "cmis:lastModificationDate": {
               "cardinality": "single",
               "description": "Last Modification Date",
               "displayName": "Last Modification Date",
               "id": "cmis:lastModificationDate",
               "inherited": false,
               "localName": "cmis:lastModificationDate",
               "orderable": true,
               "propertyType": "datetime",
               "queryable": true,
               "queryName": "cmis:lastModificationDate",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:lastModifiedBy": {
               "cardinality": "single",
               "description": "Last Modified By",
               "displayName": "Last Modified By",
               "id": "cmis:lastModifiedBy",
               "inherited": false,
               "localName": "cmis:lastModifiedBy",
               "orderable": true,
               "propertyType": "string",
               "queryable": true,
               "queryName": "cmis:lastModifiedBy",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:name": {
               "cardinality": "single",
               "description": "Name",
               "displayName": "Name",
               "id": "cmis:name",
               "inherited": false,
               "localName": "cmis:name",
               "orderable": true,
               "propertyType": "string",
               "queryable": true,
               "queryName": "cmis:name",
               "required": true,
               "updatability": "readwrite"
             },
             "cmis:objectId": {
               "cardinality": "single",
               "description": "Object Id",
               "displayName": "Object Id",
               "id": "cmis:objectId",
               "inherited": false,
               "localName": "cmis:objectId",
               "orderable": false,
               "propertyType": "id",
               "queryable": true,
               "queryName": "cmis:objectId",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:objectTypeId": {
               "cardinality": "single",
               "description": "Object Type Id",
               "displayName": "Object Type Id",
               "id": "cmis:objectTypeId",
               "inherited": false,
               "localName": "cmis:objectTypeId",
               "orderable": false,
               "propertyType": "id",
               "queryable": true,
               "queryName": "cmis:objectTypeId",
               "required": true,
               "updatability": "oncreate"
             },
             "cmis:parentId": {
               "cardinality": "single",
               "description": "Parent Id",
               "displayName": "Parent Id",
               "id": "cmis:parentId",
               "inherited": false,
               "localName": "cmis:parentId",
               "orderable": false,
               "propertyType": "id",
               "queryable": false,
               "queryName": "cmis:parentId",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:path": {
               "cardinality": "single",
               "description": "Path",
               "displayName": "Path",
               "id": "cmis:path",
               "inherited": false,
               "localName": "cmis:path",
               "orderable": false,
               "propertyType": "string",
               "queryable": false,
               "queryName": "cmis:path",
               "required": false,
               "updatability": "readonly"
             },
             "cmis:secondaryObjectTypeIds": {
               "cardinality": "multi",
               "defaultValue": [],
               "description": "Secondary Type Ids",
               "displayName": "Secondary Type Ids",
               "id": "cmis:secondaryObjectTypeIds",
               "inherited": false,
               "localName": "cmis:secondaryObjectTypeIds",
               "orderable": false,
               "propertyType": "id",
               "queryable": true,
               "queryName": "cmis:secondaryObjectTypeIds",
               "required": false,
               "updatability": "readwrite"
             }
            },
            "queryable": true,
            "queryName": "cmis:folder",
            "typeId": "cmis:folder",
            "typeMutability": {
             "create": true,
             "delete": false,
             "update": false
            }
          };
          exports.addTypeDefinition("cmis:folder", folderTypeObject, function(error, result) {
            if (error) {
              callback(error);
            } else {

              // add the document type definition
              var documentTypeObject = {
                "baseId": "cmis:document",
                "contentStreamAllowed": "allowed",
                "controllableACL": true,
                "controllablePolicy": true,
                "creatable": true,
                "description": "Document",
                "displayName": "Document",
                "fileable": true,
                "fulltextIndexed": false,
                "includedInSupertypeQuery": true,
                "localName": "cmis:document",
                "localNamespace": "http://apache.org",
                "propertyDefinitions": {
                  "cmis:baseTypeId": {
                    "cardinality": "single",
                    "description": "Base Type Id",
                    "displayName": "Base Type Id",
                    "id": "cmis:baseTypeId",
                    "inherited": false,
                    "localName": "cmis:baseTypeId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": true,
                    "queryName": "cmis:baseTypeId",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:changeToken": {
                    "cardinality": "single",
                    "description": "Change Token",
                    "displayName": "Change Token",
                    "id": "cmis:changeToken",
                    "inherited": false,
                    "localName": "cmis:changeToken",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:changeToken",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:checkinComment": {
                    "cardinality": "single",
                    "description": "Checkin Comment",
                    "displayName": "Checkin Comment",
                    "id": "cmis:checkinComment",
                    "inherited": false,
                    "localName": "cmis:checkinComment",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:checkinComment",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:contentStreamFileName": {
                    "cardinality": "single",
                    "description": "Filename",
                    "displayName": "Filename",
                    "id": "cmis:contentStreamFileName",
                    "inherited": false,
                    "localName": "cmis:contentStreamFileName",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:contentStreamFileName",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:contentStreamId": {
                    "cardinality": "single",
                    "description": "Content Stream Id",
                    "displayName": "Content Stream Id",
                    "id": "cmis:contentStreamId",
                    "inherited": false,
                    "localName": "cmis:contentStreamId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": false,
                    "queryName": "cmis:contentStreamId",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:contentStreamLength": {
                    "cardinality": "single",
                    "description": "Content Stream Length",
                    "displayName": "Content Stream Length",
                    "id": "cmis:contentStreamLength",
                    "inherited": false,
                    "localName": "cmis:contentStreamLength",
                    "orderable": false,
                    "propertyType": "integer",
                    "queryable": false,
                    "queryName": "cmis:contentStreamLength",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:contentStreamMimeType": {
                    "cardinality": "single",
                    "description": "MIME Type",
                    "displayName": "MIME Type",
                    "id": "cmis:contentStreamMimeType",
                    "inherited": false,
                    "localName": "cmis:contentStreamMimeType",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:contentStreamMimeType",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:createdBy": {
                    "cardinality": "single",
                    "description": "Created By",
                    "displayName": "Created By",
                    "id": "cmis:createdBy",
                    "inherited": false,
                    "localName": "cmis:createdBy",
                    "orderable": true,
                    "propertyType": "string",
                    "queryable": true,
                    "queryName": "cmis:createdBy",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:creationDate": {
                    "cardinality": "single",
                    "description": "Creation Date",
                    "displayName": "Creation Date",
                    "id": "cmis:creationDate",
                    "inherited": false,
                    "localName": "cmis:creationDate",
                    "orderable": true,
                    "propertyType": "datetime",
                    "queryable": true,
                    "queryName": "cmis:creationDate",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:description": {
                    "cardinality": "single",
                    "description": "Description",
                    "displayName": "Description",
                    "id": "cmis:description",
                    "inherited": false,
                    "localName": "cmis:description",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:description",
                    "required": false,
                    "updatability": "readwrite"
                  },
                  "cmis:isImmutable": {
                    "cardinality": "single",
                    "description": "Is Immutable",
                    "displayName": "Is Immutable",
                    "id": "cmis:isImmutable",
                    "inherited": false,
                    "localName": "cmis:isImmutable",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": false,
                    "queryName": "cmis:isImmutable",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:isLatestMajorVersion": {
                    "cardinality": "single",
                    "description": "Is Latest Major Version",
                    "displayName": "Is Latest Major Version",
                    "id": "cmis:isLatestMajorVersion",
                    "inherited": false,
                    "localName": "cmis:isLatestMajorVersion",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": false,
                    "queryName": "cmis:isLatestMajorVersion",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:isLatestVersion": {
                    "cardinality": "single",
                    "description": "Is Latest Version",
                    "displayName": "Is Latest Version",
                    "id": "cmis:isLatestVersion",
                    "inherited": false,
                    "localName": "cmis:isLatestVersion",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": false,
                    "queryName": "cmis:isLatestVersion",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:isMajorVersion": {
                    "cardinality": "single",
                    "description": "Is Major Version",
                    "displayName": "Is Major Version",
                    "id": "cmis:isMajorVersion",
                    "inherited": false,
                    "localName": "cmis:isMajorVersion",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": false,
                    "queryName": "cmis:isMajorVersion",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:isPrivateWorkingCopy": {
                    "cardinality": "single",
                    "description": "Is Private Working Copy",
                    "displayName": "Is Private Working Copy",
                    "id": "cmis:isPrivateWorkingCopy",
                    "inherited": false,
                    "localName": "cmis:isPrivateWorkingCopy",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": true,
                    "queryName": "cmis:isPrivateWorkingCopy",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:isVersionSeriesCheckedOut": {
                    "cardinality": "single",
                    "description": "Is Verison Series Checked Out",
                    "displayName": "Is Verison Series Checked Out",
                    "id": "cmis:isVersionSeriesCheckedOut",
                    "inherited": false,
                    "localName": "cmis:isVersionSeriesCheckedOut",
                    "orderable": false,
                    "propertyType": "boolean",
                    "queryable": true,
                    "queryName": "cmis:isVersionSeriesCheckedOut",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:lastModificationDate": {
                    "cardinality": "single",
                    "description": "Last Modification Date",
                    "displayName": "Last Modification Date",
                    "id": "cmis:lastModificationDate",
                    "inherited": false,
                    "localName": "cmis:lastModificationDate",
                    "orderable": true,
                    "propertyType": "datetime",
                    "queryable": true,
                    "queryName": "cmis:lastModificationDate",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:lastModifiedBy": {
                    "cardinality": "single",
                    "description": "Last Modified By",
                    "displayName": "Last Modified By",
                    "id": "cmis:lastModifiedBy",
                    "inherited": false,
                    "localName": "cmis:lastModifiedBy",
                    "orderable": true,
                    "propertyType": "string",
                    "queryable": true,
                    "queryName": "cmis:lastModifiedBy",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:name": {
                    "cardinality": "single",
                    "description": "Name",
                    "displayName": "Name",
                    "id": "cmis:name",
                    "inherited": false,
                    "localName": "cmis:name",
                    "orderable": true,
                    "propertyType": "string",
                    "queryable": true,
                    "queryName": "cmis:name",
                    "required": true,
                    "updatability": "readwrite"
                  },
                  "cmis:objectId": {
                    "cardinality": "single",
                    "description": "Object Id",
                    "displayName": "Object Id",
                    "id": "cmis:objectId",
                    "inherited": false,
                    "localName": "cmis:objectId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": true,
                    "queryName": "cmis:objectId",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:objectTypeId": {
                    "cardinality": "single",
                    "description": "Object Type Id",
                    "displayName": "Object Type Id",
                    "id": "cmis:objectTypeId",
                    "inherited": false,
                    "localName": "cmis:objectTypeId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": true,
                    "queryName": "cmis:objectTypeId",
                    "required": true,
                    "updatability": "oncreate"
                  },
                  "cmis:parentId": {
                    "cardinality": "single",
                    "description": "Parent Id",
                    "displayName": "Parent Id",
                    "id": "cmis:parentId",
                    "inherited": false,
                    "localName": "cmis:parentId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": false,
                    "queryName": "cmis:parentId",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:secondaryObjectTypeIds": {
                    "cardinality": "multi",
                    "defaultValue": [],
                    "description": "Secondary Type Ids",
                    "displayName": "Secondary Type Ids",
                    "id": "cmis:secondaryObjectTypeIds",
                    "inherited": false,
                    "localName": "cmis:secondaryObjectTypeIds",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": true,
                    "queryName": "cmis:secondaryObjectTypeIds",
                    "required": false,
                    "updatability": "readwrite"
                  },
                  "cmis:versionLabel": {
                    "cardinality": "single",
                    "description": "Version Label",
                    "displayName": "Version Label",
                    "id": "cmis:versionLabel",
                    "inherited": false,
                    "localName": "cmis:versionLabel",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": true,
                    "queryName": "cmis:versionLabel",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:versionSeriesCheckedOutBy": {
                    "cardinality": "single",
                    "description": "Version Series Checked Out By",
                    "displayName": "Version Series Checked Out By",
                    "id": "cmis:versionSeriesCheckedOutBy",
                    "inherited": false,
                    "localName": "cmis:versionSeriesCheckedOutBy",
                    "orderable": false,
                    "propertyType": "string",
                    "queryable": false,
                    "queryName": "cmis:versionSeriesCheckedOutBy",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:versionSeriesCheckedOutId": {
                    "cardinality": "single",
                    "description": "Version Series Checked Out Id",
                    "displayName": "Version Series Checked Out Id",
                    "id": "cmis:versionSeriesCheckedOutId",
                    "inherited": false,
                    "localName": "cmis:versionSeriesCheckedOutId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": false,
                    "queryName": "cmis:versionSeriesCheckedOutId",
                    "required": false,
                    "updatability": "readonly"
                  },
                  "cmis:versionSeriesId": {
                    "cardinality": "single",
                    "description": "Version Series Id",
                    "displayName": "Version Series Id",
                    "id": "cmis:versionSeriesId",
                    "inherited": false,
                    "localName": "cmis:versionSeriesId",
                    "orderable": false,
                    "propertyType": "id",
                    "queryable": true,
                    "queryName": "cmis:versionSeriesId",
                    "required": false,
                    "updatability": "readonly"
                  }
                },
                "queryable": true,
                "queryName": "cmis:document",
                "typeId": "cmis:document",
                "typeMutability": {
                  "create": true,
                  "delete": false,
                  "update": false
                },
                "versionable": false
              };
              exports.addTypeDefinition("cmis:document", documentTypeObject, function(error, result) {
                if (error) {
                  callback(error);
                } else {
                  callback(null, repositoryObject);
                }
              });
            }
          });
        }
      });
    };
  });
};

/**
 * Adds a folder to the database
 */
exports.addFolderObject = function(name, description, path, callback) {

  var guid = uuid.v4();

  var folderObject = {
    "cmis:objectId": guid,
    "cmis:createdBy": "system",
    "cmis:creationDate": new Date().getTime(),
    "cmis:lastModifiedBy": "system",
    "cmis:lastModificationDate": new Date().getTime(),
    "cmis:baseTypeId": "cmis:folder",
    "cmis:objectTypeId": "cmis:folder",
  }

  if (name) {
    folderObject["cmis:name"] = name;
  } else {
    folderObject["cmis:name"] = guid;
  }

  if (description) {
    folderObject["cmis:description"] = description;
  }

  if (path)
  {
    folderObject["cmis:path"] = path;
  }

  console.log("Adding folder object: " + JSON.stringify(folderObject, null, 2));

  // insert folder into DynamoDB
  var folderParams = {
    TableName: OBJECTS_TABLE_NAME,
    Item: folderObject
  }

  dynamodb.putItem(folderParams, function(error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, folderObject);
    }
  });
};

/**
 * Adds a type definiton to the database
 */
exports.addTypeDefinition = function(typeId, typeDefinition, callback) {

  if (typeDefinition.typeId === undefined) {
    typeDefinition.typeId = typeId;
  }

  console.log("Adding type object: " + JSON.stringify(typeDefinition, null, 2));

  var typeParams = {
    TableName: TYPES_TABLE_NAME,
    Item: typeDefinition
  }

  dynamodb.putItem(typeParams, function(error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, typeDefinition);
    }
  });
};