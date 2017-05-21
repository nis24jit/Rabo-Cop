/**
 * This is the test suite that checks for the core requirements
 * of the app.
 * The scenarios can be any and some of the following
 * 1)The records are duplicate.
 * 2)The records have invalid end balance after mutation.
 * 3)The records can be duplicate as well as have invalid balance.
 *
**/
'use strict';

describe('Factory: DataCorrectionFactory', function () {

  // load the factory's module
  beforeEach(module('raboCopApp'));

  // instantiate factory
  var DataCorrectionFactory;
  beforeEach(inject(function (_DataCorrectionFactory_) {
    DataCorrectionFactory = _DataCorrectionFactory_;
  }));

  it('should do check whether the DataCorrectionFactory is instantiated correctly', function () {
    expect(!!DataCorrectionFactory).toBe(true);
  });

  it('Test whether the records are invalid and duplicate', function () {
    expect(DataCorrectionFactory.getInvalidRecords).toBeDefined();
    var records = [
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "-51.91",
        mutation: "+38.58",
        reference: "137243",
        startbalance: "13.33"
      },
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "-51.91",
        mutation: "+38.58",
        reference: "137243",
        startbalance: "13.33"
      },

    ]
    var records = DataCorrectionFactory.getInvalidRecords(records);

    //
    expect(records.length).toBe(2);
    expect(records[1].errorType).toBe("bothInvalid");
    expect(records[1].errorDescription).toBe("The record contains invalid end balance as well as it is duplicate!!");

  });


  it('Test whether the records satisfy invalid balance criteria', function () {
    expect(DataCorrectionFactory.getInvalidRecords).toBeDefined();
    var records = [
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "-51.91",
        mutation: "+38.58",
        reference: "137243",
        startbalance: "13.33"
      },


    ]
    var records = DataCorrectionFactory.getInvalidRecords(records);
    expect(records[0].errorType).toBe("invalidBalance");
    expect(records[0].errorDescription).toBe("The record contains invalid end balance !!");

  });


  it('Test whether the records satisfy duplicate critiria', function () {
    expect(DataCorrectionFactory.getInvalidRecords).toBeDefined();
    var records = [
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "10",
        mutation: "+5",
        reference: "137243",
        startbalance: "5"
      },
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "10",
        mutation: "+5",
        reference: "137243",
        startbalance: "5"
      },


    ]
    var records = DataCorrectionFactory.getInvalidRecords(records);
     expect(records[0].errorType).toBe("duplicate");
    expect(records[0].errorDescription).toBe("The record is duplicate!!");

  });


  it('Test whether the correct count of records are determined', function () {
    expect(DataCorrectionFactory.getInvalidRecords).toBeDefined();
    var records = [
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "10",
        mutation: "+5",
        reference: "137243",
        startbalance: "5"
      },
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "10",
        mutation: "+5",
        reference: "137243",
        startbalance: "5"
      },


    ]
    var records = DataCorrectionFactory.getInvalidRecords(records);
    expect(records[0].errorType).toBe("duplicate");
    expect(records[0].errorDescription).toBe("The record is duplicate!!");

  });


  it('Test whether the count of invalid records are correct', function () {
    expect(DataCorrectionFactory.getInvalidRecords).toBeDefined();
    var records = [
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "10",
        mutation: "+5",
        reference: "137243",
        startbalance: "5"
      },
      {
        accountnumber: "NL93ABNA0585619023",
        description: "Candy from Rik King",
        endbalance: "0",
        mutation: "+5",
        reference: "137243",
        startbalance: "-5"
      },


    ]
    var count = DataCorrectionFactory.getCount();
    expect(count).toBe(0);

  });



});
