/**
This is the file that is the where the massaging of the data is taking place.Some of the operations include the manipulation
of the csv and xml files so that they could be transformed to JSON.

Pattern used : Revealing module pattern for better encapsulation.

**/
var fileUtility = (function () {

  //Private Variable Declaration!!

  var attributeText = "#text";

  var filesThatCanBeParsed = {

    "xml": "xml",
    "csv": "csv",

    fileTypes: ["xml", "csv"]

  }


  /**
   * Transform the keys of an object
   * @param:obj the object that needs the
   * transformation
   */

  function convertObjectKeysToLowerCase(obj) {

    var key, keys = Object.keys(obj);
    var n = keys.length;
    var newobj = {}
    while (n--) {
      key = keys[n];
      newobj[key.toLowerCase().replace(" ", "")] = obj[key];
    }

    return newobj;
  }


  /**
   * Converts the input xml to json format
   * @param:xml file that needs to be converted
   */
  function getJsonFromXml(xml) {


    var jsonObj = xmlToJson(xml);
    return sanitizeObjects(jsonObj);

  }

  /**
   * Converts the objects to the required format.
   * @param:rowObjects
   */
  function sanitizeObjects(rowObjects) {

    var records;

    if (rowObjects.records) {

      records = rowObjects.records.record;
    } else {
      records = rowObjects;
    }

    var sanitizedRecords = [];
    records.forEach(function (obj) {
      obj = fileUtility.convertObjectKeysToLowerCase(obj);
      var actualObject = {};
      var keys = Object.keys(obj);
      keys.forEach(function (val) {

        if (val !== attributeText) {

          if (obj[val][attributeText]) {
            actualObject[val] = decodeURI(obj[val][attributeText]);
          } else {
            actualObject[val] = decodeURI(obj[val]);

          }
          var value = angular.copy(actualObject[val]);
          if (value[value.length - 1] === '�') {
            var newValue = value.substring(0, value.length - 1) + 'ß';
            actualObject[val] = newValue;
          }

        }

      });
      sanitizedRecords.push(actualObject);

    });
    return sanitizedRecords;

  }


  function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj[attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) === "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) === "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }

    return obj;
  };

  /**
   * Converts the csv file to json
   * @param:csv
   */

  function getJsonFromCsv(csv) {

    var convertedObjects = $.csv.toObjects(csv);
    return sanitizeObjects(convertedObjects);

  }

  //Expose public api's here!!
  return {

    convertXmlToJson: getJsonFromXml,
    convertCsvToJson: getJsonFromCsv,
    permittedFiles: filesThatCanBeParsed,
    sanitizeObjects: sanitizeObjects,
    convertObjectKeysToLowerCase: convertObjectKeysToLowerCase

  };

})();
