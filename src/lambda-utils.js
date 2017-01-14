'use strict';

/**
 * Constructs a response object API Gateway expects when using lambda proxy mode.
 */
exports.buildProxyResponseObject = function(result, statusCode, headers) {

  console.log("Constructing proxy response object...");

  if (!statusCode) {
    statusCode = 200;
  }

  // construct the object API gateway expects
  var response = {
    statusCode: statusCode,
    body: JSON.stringify(result)
  };

  if (!headers) {
    response.headers = headers;
  }

  console.log("Returning result: " + JSON.stringify(response, null, 2));

  return response;
};

/**
 * Parses an event object into an options object
 */
exports.parseEvent = function(event) {

  console.log("Parsing event...");

  var options = {};

  if (event) {
    options.succinct = event.succinct;
    options.includeAllowableActions = event.includeAllowableActions;

    // TODO: setup paging info and other flags
  }

  console.log("Returning result: " + JSON.stringify(options, null, 2));

  return options;
};

/**
 * Parse properties from urlencoded form into an object
 */
exports.parseProperties = function(params) {

  console.log("Parsing properties...");

  // convert params into JSON object
	var properties = {};
	var counter = 0;
	var paramName, paramValue;
	do {
	    paramName = params["propertyId[" + counter + "]"];
	    paramValue = params["propertyValue[" + counter + "]"];
	    if (paramName !== undefined) {
	        properties[paramName] = paramValue;
	        counter++;
	    }
	} while (paramName !== undefined);

	console.log("Returning result: " + JSON.stringify(properties, null, 2));

	return properties;
};