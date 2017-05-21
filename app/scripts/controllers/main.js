/**
 * @ngdoc function
 * @name raboCopApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the raboCopApp
 */


(function () {
    'use strict';

    angular
        .module('raboCopApp')
        .controller('MainCtrl', MainCtrl);

    MainCtrl.$inject = ['$scope', 'DataCorrectionFactory'];

    /* @ngInject */
    function MainCtrl($scope, DataCorrectionFactory) {

        /**
         * Instantiate the file reader and api.
         *
         */
        $scope.instantiateFileReader = function () {
            $scope.showRecords = false;
            $scope.showPanel = true;

            $(document).ready(function () {
                $('#files').bind('change', $scope.handleFileSelect);
            });
        }

        $scope.instantiateFileReader();


        /**
         * Clears the file that has been
         * operated upon!!
         */

        $scope.clearSelection = function () {

            $scope.showRecords = false;
            $scope.showPanel = true;
        }


        /**
         * Handle the file select event
         * @param : evt exposed by the file reader
         */

        $scope.handleFileSelect = function (evt) {
            var files = evt.target.files; // FileList object
            var file = files[0];
            // read the file contents
            $scope.renderInvalidRecords(file);

        }


        /**
         * Render the invalid records
         * @param : file to be transformed
         */

        $scope.renderInvalidRecords = function (file) {
            document.getElementById('files').value = null;
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function (event) {

                $scope.validCSVRecords = [];
                $scope.invalidCSVRecords = [];
                $scope.validDataset = [];
                $scope.inValidDataset = [];

                var fileObj = event.target.result;
                $scope.processRecords(fileObj, file);

            };
            reader.onerror = function () {
                alert('Unable to read ' + file.fileName);
            };
        }

        /**
         * Process the csv and xml records
         * @param :fileObj the file object
         * @param :file the original file that was uploaded
         */
        $scope.processRecords = function (fileObj, file) {

            var filteredObjects = -1;
            var fileExtension = file.name.split(".");
            $scope.showInvalidRecords = true;
            $scope.inValidDataset = [];
            $scope.countText = "All records are valid!!"

            if (fileExtension[1]) {

                try {
                    if (fileUtility.permittedFiles.fileTypes.indexOf(fileExtension[1]) > -1) {

                        if (fileExtension[1] === fileUtility.permittedFiles.xml) {
                            var xmlDoc = $.parseXML(fileObj);
                            filteredObjects = fileUtility.convertXmlToJson(xmlDoc);

                        } else {
                            filteredObjects = fileUtility.convertCsvToJson(fileObj);
                        }
                        $('#myModal').modal({
                            backdrop: 'static',
                            keyboard: false
                        })
                        $('#myModal').modal('show');


                    } else {
                        $scope.errorText = "Please enter a file of extension xml or csv !!";
                        $('#errorModal').modal('show');


                    }


                } catch (e) {
                    $scope.errorText = "It seems that you have entered invalid data !! please try again";
                    $('#errorModal').modal('show');
                }


            }

            if (filteredObjects !== -1) {

                $scope.validCSVRecords = angular.copy(filteredObjects);
                $scope.validDataset = [].concat($scope.validCSVRecords);
                $scope.invalidCSVRecords = angular.copy(DataCorrectionFactory.getInvalidRecords(filteredObjects));
                if ($scope.invalidCSVRecords.length > 0) {

                    if ($scope.invalidCSVRecords.length === 1) {
                        $scope.countText = "There is " + $scope.invalidCSVRecords.length + " invalid record !!";

                    } else {
                        $scope.countText = "There are " + $scope.invalidCSVRecords.length + " invalid records !!";
                    }


                }

                if ($scope.invalidCSVRecords.length === 0) {
                    $scope.showInvalidRecords = false;
                }
                $scope.inValidDataset = [].concat($scope.invalidCSVRecords);
                $scope.showRecords = true;
                $scope.showPanel = false;
            }

            $scope.$apply();

        }


    }

})();


