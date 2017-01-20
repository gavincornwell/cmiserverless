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
exports.parseOptions = function(event) {

  console.log("Parsing options...");

  var options = {};

  if (event) {
    options.succinct = event.queryStringParameters.succinct;
    options.includeAllowableActions = event.queryStringParameters.includeAllowableActions;

    // TODO: setup paging info and other flags
  }

  console.log("Returning result: " + JSON.stringify(options, null, 2));

  return options;
};

/**
 * Parse x-www-form-urlencoded form body into object
 */
exports.parseUrlEncodedBody = function(event) {

  console.log("Parsing x-www-form-urlencoded body...");

  var result = {};

  if (event.body) {
    // split the string into name=value pairs
    var params = event.body.split("&");

    // split each name=value pair and store in result object
    params.forEach(function (item, index, array) {
      var nameValue = item.split("=");
      var name, value;
      if (nameValue.length >= 1) {
        name = decodeURIComponent(nameValue[0]);
        if (nameValue.length >=2) {
          value = decodeURIComponent(nameValue[1]);
        } else {
          value = "";
        }

        result[name] = value;
      }
    });
  }

  console.log("Returning result: " + JSON.stringify(result, null, 2));

  return result;
}

/**
 * Parse individual properties from urlencoded form into an object
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