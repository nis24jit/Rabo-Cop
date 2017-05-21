'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('raboCopApp'));

  var MainCtrl,
    scope, $rootScope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('Test the files that were uploaded', function () {

    scope.clearSelection();
    expect(scope.showRecords).toBe(false);

  });

  it('check whether the records api is defined', function () {

    scope.clearSelection();
    var file = {name: "records.xml"};
    var fileObj =

      "<records><record reference='175885'>"+
      "<accountNumber>NL43AEGO0773393871</accountNumber>"+
      "<description>Clothes for Richard de Vries</description>"+
      "<startBalance>5429</startBalance>"+
      "<mutation>-939</mutation>"+
      "<endBalance>6368</endBalance>"+
      "</record>"+
      "<record reference='175885'>"+
      "<accountNumber>NL43AEGO0773393871</accountNumber>"+
      "<description>Clothes for Richard de Vries</description>"+
      "<startBalance>5429</startBalance>"+
      "<mutation>-939</mutation>"+
      "<endBalance>6368</endBalance>"+
      "</record>"+
       "</records>"

      expect(scope.processRecords).toBeDefined();


  });

  it('call the csv records', function () {
    scope.clearSelection();
    var file = {name: "records.csv"};
    var fileObj ="Reference,Account Number,Description,Start Balance,Mutation,End Balance 137243,NL93ABNA0585619023,Candy from Rik King,13.33,+38.58,-51.91"
    scope.processRecords(fileObj,file);
    expect(scope.processRecords).toBeDefined();

  });

});
