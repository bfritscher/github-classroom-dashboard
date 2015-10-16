'use strict';

/**
 * @ngdoc overview
 * @name githubClassroomDashboardApp
 * @description
 * # githubClassroomDashboardApp
 *
 * Main module of the application.
 */
angular
  .module('githubClassroomDashboardApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
    $httpProvider.interceptors.push('apiInterceptor');
  });
