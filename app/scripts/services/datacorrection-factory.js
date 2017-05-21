'use strict';

/**
 * @ngdoc service
 * @name raboCopApp.DataCorrectionFactory
 * @description
 * # DataCorrectionFactory
 * Factory in the raboCopApp.
 */

// AngularJS will instantiate a singleton by calling "new" on this function
angular.module('raboCopApp')
  .factory('DataCorrectionFactory', DataCorrectionFactory);

function DataCorrectionFactory() {

  //Encapsulating private variables and functions.

  var keys = {};
  var inValidCount = 0;

  /**
   * A hashtable to store unique values
   */
  var hash = (function () {

    return {
      contains: function (key) {
        return keys[key] === true;
      },
      add: function (key) {
        if (keys[key] !== true) {
          keys[key] = true;
        }
      }
    };
  })();
//Publicly exposed functions .
  var dataCorrectionFactory = {

    getInvalidRecords: getInvalidRecords,
    getCount: getCount
  }

  return dataCorrectionFactory;


  /**
   * The function to validate the uploaded records
   * param : the record set that needs transformation
   */

  function getInvalidRecords(records) {

    keys = {};
    var invalidRecords = [];
    var isDuplicate = false;

    records.forEach(function (obj) {


      if (!hash.contains(obj.reference)) {
        hash.add(obj.reference);
      } else {

        obj.errorType = "duplicate";
        obj.errorDescription = "The record is duplicate!!"

      }
      var mutation;
      var operator = obj.mutation[0];
      if (operator !== '+' && operator !== '-') {


        operator = '+';
        mutation = parseInt(obj.mutation[0]);

      } else {

        mutation = parseFloat(obj.mutation.slice(1, obj.mutation.length))
      }

      var startBalance = parseFloat(obj["startbalance"])
      var endBalance = parseFloat(obj["endbalance"]).toFixed(2);
      var total = -1;
      if (operator === '+') {

        total = startBalance + mutation;
      } else {
        total = startBalance - mutation;
      }

      total = total.toFixed(2);

      if (total !== endBalance || obj.errorType === 'duplicate') {

        if (total !== endBalance && obj.errorType === 'duplicate') {

          obj.errorType = "bothInvalid";
          obj.errorDescription = "The record contains invalid end balance as well as it is duplicate!!"

        } else if (total !== endBalance) {
          obj.errorDescription = "The record contains invalid end balance !!"
          obj.errorType = 'invalidBalance';
        }

        invalidRecords.push(obj);
      }


    }.bind(this));

    inValidCount = invalidRecords.length;
    return invalidRecords;

  }

  function getCount() {

    return inValidCount;

  }

}
