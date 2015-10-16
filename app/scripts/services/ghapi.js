'use strict';

/**
 * @ngdoc service
 * @name githubClassroomDashboardApp.ghApi
 * @description
 * # ghApi
 * Factory in the githubClassroomDashboardApp.
 */
angular.module('githubClassroomDashboardApp')
  .factory('ghApi', function () {

    var ghApi = {
      rateLimit: {
        remaining: 0,
        limit: 0,
        reset: 0,
        resetCoutdown: function(){
          return Math.round(((ghApi.rateLimit.reset * 1000) - new Date().getTime()) / (60 * 1000));
        }
      }
    };
    // Public API here
    return ghApi;
  });
