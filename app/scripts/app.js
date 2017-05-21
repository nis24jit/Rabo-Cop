'use strict';

/**
 * @ngdoc overview
 * @name raboCopApp
 * @description
 * # raboCopApp
 *
 * Main module of the application and the entry point
 */
angular
  .module('raboCopApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'smart-table'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
