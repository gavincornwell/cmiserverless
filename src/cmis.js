'use strict';

let uuid = require('node-uuid');
let aws = require('aws-sdk');
let doc = require('dynamodb-doc');
let dynamodb = new doc.DynamoDB();
let s3 = new aws.S3();

// constants
let REPOSITORIES_TABLE_NAME = "CMISRepositories";
let TYPES_TABLE_NAME = "CMISTypes";
let OBJECTS_TABLE_NAME = "CMISObjects";
let CONTENT_BUCKET = "cmiserverless-content";

/**
 * Retrieves all repositories from the database
 */
exports.getRepositories = function(callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  console.log("Retrieving all repositories...");

  // scan the repositories table
  var params = {
      TableName : REPOSITORIES_TABLE_NAME
  }

  dynamodb.scan(params, function(error, result) {
    if (error) {
      callback(error);
    } else {
      console.log("Returning result: " + JSON.stringify(result.Items, null, 2));
      callback(null, result.Items);
    }
  });
};

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

  console.log("Retrieving repository with id '" + repoId + "'...");

  // retrieve the type definition from the database
  var params = {
    TableName : REPOSITORIES_TABLE_NAME,
    Key: {
      "repositoryId": repoId
    }
  };

  dynamodb.getItem(params, function(error, result) {
      if (error) {
        callback(error);
      } else {
        console.log("Returning result: " + JSON.stringify(result.Item, null, 2));
        callback(null, result.Item);
      }
  });
};

exports.getTypeDefinition = function(repoId, typeId, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check typeId has been provided
  if (!typeId || typeId === null) {
    callback("typeId parameter is mandatory", null);
    return;
  }

  console.log("Retrieving type definition with id '" + typeId + "'...");

  // retrieve the type definition from the database
  var params = {
    TableName : TYPES_TABLE_NAME,
    Key: {
      "typeId": typeId
    }
  };

  dynamodb.getItem(params, function(error, result) {
    if (error) {
      callback(error);
    } else {

      // replace typeId property with id
      if (result.Item.typeId !== "")
      {
          result.Item.id = result.Item.typeId;
      }
      console.log("Returning result: " + JSON.stringify(result.Item, null, 2));
      callback(null, result.Item);
    }
  });
};

/**
 * Retrieves a list of type descendants
 */
exports.getTypeDescendants = function(repoId, typeId, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check typeId has been provided
  if (!typeId || typeId === null) {
    callback("typeId parameter is mandatory", null);
    return;
  }

  console.log("Retrieving type descendants for type '" + typeId + "'...");

  // we don't store these yet so just return an empty array
  var result = [];
  console.log("Returning result: " + JSON.stringify(result, null, 2));
  callback(null, result);
};

/**
 * Retrieves an object from the database
 */
exports.getObject = function(repoId, objectId, options, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check objectId has been provided
  if (!objectId || objectId === null) {
    callback("objectId parameter is mandatory", null);
    return;
  }

  // ensure we have an options object
  if (!options) options = {};

  console.log("Retrieving object with id '" + objectId + "'...");

  // retrieve the object from the database
	var params = {
    TableName : OBJECTS_TABLE_NAME,
    Key:{
      "cmis:objectId": objectId
    }
  }

  dynamodb.getItem(params, function(error, data) {
    if (error) {
      callback(error);
    } else {
      var object = {};

      // add the allowable actions, if requested
      if (options.includeAllowableActions) {
        object.allowableActions = {
          "canDeleteObject": false,
          "canUpdateProperties": false,
          "canGetFolderTree": false,
          "canGetProperties": true,
          "canGetObjectRelationships": false,
          "canGetObjectParents": false,
          "canGetFolderParent": false,
          "canGetDescendants": false,
          "canMoveObject": false,
          "canDeleteContentStream": false,
          "canCheckOut": false,
          "canCancelCheckOut": false,
          "canCheckIn": false,
          "canSetContentStream": false,
          "canGetAllVersions": false,
          "canAddObjectToFolder": false,
          "canRemoveObjectFromFolder": false,
          "canGetContentStream": true,
          "canApplyPolicy": false,
          "canGetAppliedPolicies": false,
          "canRemovePolicy": false,
          "canGetChildren": true,
          "canCreateDocument": false,
          "canCreateFolder": true,
          "canCreateRelationship": false,
          "canCreateItem": false,
          "canDeleteTree": false,
          "canGetRenditions": false,
          "canGetACL": false,
          "canApplyACL": false
        };
      }

      // if succinct response has been requested set object and return
      // otherwise get type definition and build complete response
      if (options.succinct) {
        object.succinctProperties = data.Item;
        console.log("Returning result: " + JSON.stringify(object, null, 2));
        callback(null, object);
        return;
      } else {
        // retrieve type definition for the object
        var typeId = data.Item["cmis:objectTypeId"];
        exports.getTypeDefinition(repoId, typeId, function(error, typeDefinition) {
          if (error) {
            callback(error);
          } else {
            object.properties = {};
            for (let propertyName in data.Item) {
              var propertyDefinition = typeDefinition.propertyDefinitions[propertyName];
              if (!propertyDefinition) {
                callback("Unknown property: " + propertyName);
                return;
              } else {
                object.properties[propertyName] = {
                  "id": propertyName,
                  "localName": propertyDefinition.localName,
                  "displayName": propertyDefinition.displayName,
                  "queryName": propertyDefinition.queryName,
                  "type": propertyDefinition.propertyType,
                  "cardinality": propertyDefinition.cardinality,
                  "value": data.Item[propertyName]
                };
              }
            }

            console.log("Returning result: " + JSON.stringify(object, null, 2));
            callback(null, object);
          }
        });
      }
    }
  });
};

/**
 * Retrieves the children for an object
 */
exports.getChildren = function(repoId, parentId, options, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check parentId has been provided
  if (!parentId || parentId === null) {
    callback("parentId parameter is mandatory", null);
    return;
  }

  // ensure we have an options object
  if (!options) options = {};

  console.log("Retrieving children of object with id '" + parentId + "'...");

  // retrieve the children of the given object from the database
  var params = {
    TableName : OBJECTS_TABLE_NAME,
    IndexName: "ParentIdIndex",
    KeyConditionExpression: "#pid = :id",
    ExpressionAttributeNames: {
        "#pid": "cmis:parentId"
    },
    ExpressionAttributeValues: {
        ":id": parentId
    }
  }
  dynamodb.query(params, function(error, data) {
    if (error) {
      callback(error);
    } else {

      // build the appropriate JSON representation
      var results = {};
      var items = [];

      // construct the children response
      if (options.succinct) {
        for (var i = 0; i < data.Items.length; i++) {
            var itemObject = {
                "object": {
                    "succinctProperties": data.Items[i]
                }
            }

            items.push(itemObject);
        }

        results = {
            "objects": items,
            "hasMoreItems": false,
            "numItems": data.Count
        }

        console.log("Returning result: " + JSON.stringify(results, null, 2));
        callback(null, results);
      } else {
        // TODO: extract object building to separate method to support this
        throw "Full response for getChildren not supported, please use succinct";
      }
    }
  });
};

/**
 * Retrieves the content for an object
 */
exports.getContentStream = function(repoId, objectId, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check objectId has been provided
  if (!objectId || objectId === null) {
    callback("objectId parameter is mandatory", null);
    return;
  }

  console.log("Retrieving content for object with id '" + objectId + "'...");

  // retrieve the object from the database
	var params = {
    TableName : OBJECTS_TABLE_NAME,
    Key:{
        "cmis:objectId": objectId
    }
  }
  dynamodb.getItem(params, function(error, data) {
    if (error) {
      callback(error);
    } else {

      var contentStreamId = data.Item["cmis:contentStreamId"];

      if (contentStreamId !== undefined)
      {
        // get content from S3
        var bucketParams = {
          Bucket: CONTENT_BUCKET,
          Key: contentStreamId
        }
        s3.getObject(bucketParams, function(error, data) {
          if (error) {
            callback(error);
          } else {

            // convert result into content string
            let content = data.Body.toString('utf-8');

            console.log("Returning result: " + content);

            // return content
            callback(null, content);
          }
        });
      } else {
        // return empty string for content as there is none!
        console.log("Returning result: ");
        callback(null, "");
      }
    }
  });
};

/**
 * Adds a folder to the database
 */
exports.addFolderObject = function(repoId, parentId, name, description, options, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // ensure we have an options object
  if (!options) options = {};

  console.log("Adding folder object to parent id '" + parentId + "'...");

  // define function to do the actual processing
  var process = function(parentPath) {

    // create folder object
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

    if (parentId) {
      folderObject["cmis:parentId"] = parentId;

      var folderPath = parentPath;
      if (parentPath !== "/")
      {
          folderPath += "/";
      }
      folderPath += folderObject["cmis:name"];
      folderObject["cmis:path"] = folderPath;
    } else {
      folderObject["cmis:path"] = "/";
    }

    // insert folder into DynamoDB
    var folderParams = {
      TableName: OBJECTS_TABLE_NAME,
      Item: folderObject
    };

    dynamodb.putItem(folderParams, function(error, data) {
      if (error) {
        callback(error);
      } else {
        // retrieve and return new object
        exports.getObject(repoId, guid, options, callback);
      }
    });
  };

  // do the actual processing
  if (!parentId || parentId === null) {
    process("/");
  } else {

    // retrieve the parent so we can build the path
    var parentOptions = {
      "succinct": true
    };
    exports.getObject(repoId, parentId, parentOptions, function(error, result) {
      if (error) {
        callback(error);
      } else {
        process(result.succinctProperties["cmis:path"]);
      }
    });
  }
};

/**
 * Adds a document to the database
 */
exports.addDocumentObject = function(repoId, parentId, name, description, content, mimeType, options, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check objectId has been provided
  if (!parentId || parentId === null) {
    callback("parentId parameter is mandatory", null);
    return;
  }

  // ensure we have an options object
  if (!options) options = {};

  console.log("Adding document object to parent id '" + parentId + "'...");

  // extract content from params and create object in S3
//	var content = params.content;
//	if (content === undefined)
//	{
//	    content = "";
//	}
//	else
//	{
//	    content = decodeURIComponent(content);
//	    content = content.replace(/\+/g, " ");
//	}

	if (!content || content === null) {
      content = "";
  }

	if (!mimeType || mimeType === null) {
	    mimeType = "text/plain";
	}

	// create folder object
  var guid = uuid.v4();

  var documentObject = {
    "cmis:objectId": guid,
    "cmis:createdBy": "system",
    "cmis:creationDate": new Date().getTime(),
    "cmis:lastModifiedBy": "system",
    "cmis:lastModificationDate": new Date().getTime(),
    "cmis:baseTypeId": "cmis:document",
    "cmis:objectTypeId": "cmis:document",
    "cmis:parentId": parentId
  }

	if (name) {
    documentObject["cmis:name"] = name;
  } else {
    documentObject["cmis:name"] = guid;
  }

  if (description) {
    documentObject["cmis:description"] = description;
  }

	// generate id for content
	var contentId = uuid.v4();

	// Upload the content to an S3 bucket
	var bucketParams = {
	  Bucket: CONTENT_BUCKET,
    Key: contentId,
    Body: content,
    ContentType: mimeType
	};
  s3.putObject(bucketParams, function(error) {
    if (error) {
      callback(error);
    } else {

      // add content stream related properties to response
      documentObject["cmis:contentStreamId"] = contentId;
      documentObject["cmis:contentStreamFileName"] = documentObject["cmis:name"];
      documentObject["cmis:contentStreamMimeType"] = mimeType;
      documentObject["cmis:contentStreamLength"] = content.length;

      // create the document node in the database
      var documentParams = {
          TableName: OBJECTS_TABLE_NAME,
          Item: documentObject
      }
      dynamodb.putItem(documentParams, function(error, data) {
        if (error) {
          callback(error);
        } else {
          // retrieve and return new object
          exports.getObject(repoId, guid, options, callback);
        }
      });
    }
  });
};

/**
 * Adds a type definiton to the database
 */
exports.addTypeDefinition = function(repoId, typeId, typeDefinition, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function") ) {
    throw "callback is not a function";
  }

  // check typeId has been provided
  if (!typeId || typeId === null) {
    callback("typeId parameter is mandatory", null);
    return;
  }

  if (typeDefinition.typeId === undefined) {
    typeDefinition.typeId = typeId;
  }

  console.log("Adding type definition for type '" + typeId + "'...");

  var typeParams = {
    TableName: TYPES_TABLE_NAME,
    Item: typeDefinition
  }

  dynamodb.putItem(typeParams, function(error, result) {
    if (error) {
      callback(error);
    } else {
      console.log("Returning result: " + JSON.stringify(typeDefinition, null, 2));
      callback(null, typeDefinition);
    }
  });
};

/**
 * Adds a repository to the database
 */
exports.addRepository = function(repoId, baseUrl, callback) {

  // check callback is a function
  if (!callback || callback === null || !(typeof callback == "function")) {
    throw "callback is not a function";
  }

  // check repoId has been provided
  if (!repoId || repoId === null) {
    callback("repoId parameter is mandatory", null);
    return;
  }

  // check baseUrl has been provided
  if (!baseUrl || baseUrl === null) {
    callback("baseUrl parameter is mandatory", null);
    return;
  }

  console.log("Adding repository with id '" + repoId + "'...");

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
    "localName": "folder",
    "localNamespace": "http://apache.org",
    "propertyDefinitions": {
     "cmis:allowedChildObjectTypeIds": {
       "cardinality": "multi",
       "defaultValue": [],
       "description": "Allowed Child Object Type Ids",
       "displayName": "Allowed Child Object Type Ids",
       "id": "cmis:allowedChildObjectTypeIds",
       "inherited": false,
       "localName": "allowedChildObjectTypeIds",
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
       "localName": "baseTypeId",
       "orderable": false,
       "propertyType": "id",
       "queryable": false,
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
       "localName": "changeToken",
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
       "localName": "createdBy",
       "orderable": true,
       "propertyType": "string",
       "queryable": false,
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
       "localName": "creationDate",
       "orderable": true,
       "propertyType": "datetime",
       "queryable": false,
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
       "localName": "description",
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
       "localName": "lastModificationDate",
       "orderable": true,
       "propertyType": "datetime",
       "queryable": false,
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
       "localName": "lastModifiedBy",
       "orderable": true,
       "propertyType": "string",
       "queryable": false,
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
       "localName": "name",
       "orderable": true,
       "propertyType": "string",
       "queryable": false,
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
       "localName": "objectId",
       "orderable": false,
       "propertyType": "id",
       "queryable": false,
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
       "localName": "objectTypeId",
       "orderable": false,
       "propertyType": "id",
       "queryable": false,
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
       "localName": "parentId",
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
       "localName": "path",
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
       "localName": "secondaryObjectTypeIds",
       "orderable": false,
       "propertyType": "id",
       "queryable": false,
       "queryName": "cmis:secondaryObjectTypeIds",
       "required": false,
       "updatability": "readwrite"
     }
    },
    "queryable": false,
    "queryName": "cmis:folder",
    "typeId": "cmis:folder",
    "typeMutability": {
     "create": true,
     "delete": false,
     "update": false
    }
  };
  exports.addTypeDefinition(repoId, "cmis:folder", folderTypeObject, function(error, result) {
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
        "localName": "document",
        "localNamespace": "http://apache.org",
        "propertyDefinitions": {
          "cmis:baseTypeId": {
            "cardinality": "single",
            "description": "Base Type Id",
            "displayName": "Base Type Id",
            "id": "cmis:baseTypeId",
            "inherited": false,
            "localName": "baseTypeId",
            "orderable": false,
            "propertyType": "id",
            "queryable": false,
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
            "localName": "changeToken",
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
            "localName": "checkinComment",
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
            "localName": "contentStreamFileName",
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
            "localName": "contentStreamId",
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
            "localName": "contentStreamLength",
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
            "localName": "contentStreamMimeType",
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
            "localName": "createdBy",
            "orderable": true,
            "propertyType": "string",
            "queryable": false,
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
            "localName": "creationDate",
            "orderable": true,
            "propertyType": "datetime",
            "queryable": false,
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
            "localName": "description",
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
            "localName": "isImmutable",
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
            "localName": "isLatestMajorVersion",
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
            "localName": "isLatestVersion",
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
            "localName": "isMajorVersion",
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
            "localName": "isPrivateWorkingCopy",
            "orderable": false,
            "propertyType": "boolean",
            "queryable": false,
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
            "localName": "isVersionSeriesCheckedOut",
            "orderable": false,
            "propertyType": "boolean",
            "queryable": false,
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
            "localName": "lastModificationDate",
            "orderable": true,
            "propertyType": "datetime",
            "queryable": false,
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
            "localName": "lastModifiedBy",
            "orderable": true,
            "propertyType": "string",
            "queryable": false,
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
            "localName": "name",
            "orderable": true,
            "propertyType": "string",
            "queryable": false,
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
            "localName": "objectId",
            "orderable": false,
            "propertyType": "id",
            "queryable": false,
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
            "localName": "objectTypeId",
            "orderable": false,
            "propertyType": "id",
            "queryable": false,
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
            "localName": "parentId",
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
            "localName": "secondaryObjectTypeIds",
            "orderable": false,
            "propertyType": "id",
            "queryable": false,
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
            "localName": "versionLabel",
            "orderable": false,
            "propertyType": "string",
            "queryable": false,
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
            "localName": "versionSeriesCheckedOutBy",
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
            "localName": "versionSeriesCheckedOutId",
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
            "localName": "versionSeriesId",
            "orderable": false,
            "propertyType": "id",
            "queryable": false,
            "queryName": "cmis:versionSeriesId",
            "required": false,
            "updatability": "readonly"
          }
        },
        "queryable": false,
        "queryName": "cmis:document",
        "typeId": "cmis:document",
        "typeMutability": {
          "create": true,
          "delete": false,
          "update": false
        },
        "versionable": false
      };
      exports.addTypeDefinition(repoId, "cmis:document", documentTypeObject, function(error, result) {
        if (error) {
          callback(error);
        } else {

          // TODO: use conditional put to stop multiple root folders being added

          exports.addFolderObject(repoId, null, "Root Folder", "Root Folder", null, function(error, result) {
            if (error) {
              callback(error);
            } else {
              var rootFolderId = result.properties["cmis:objectId"].value;
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

              // insert repo into DynamoDB
              var repoParams = {
                TableName: REPOSITORIES_TABLE_NAME,
                Item: repositoryObject
              };
              dynamodb.putItem(repoParams, function(error, result) {
                if (error) {
                  callback(error);
                } else {

                  console.log("Returning result: " + JSON.stringify(repositoryObject, null, 2));
                  callback(null, repositoryObject);
                }
              });
            }
          });
        };
      });
    }
  });
};