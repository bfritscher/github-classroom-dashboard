'use strict';

/**
 * @ngdoc service
 * @name githubClassroomDashboardApp.apiInterceptor
 * @description
 * # apiInterceptor
 * Factory in the githubClassroomDashboardApp.
 */
angular.module('githubClassroomDashboardApp')
  .factory('apiInterceptor', function (ghApi) {
    // Public API here
    return {
      request: function (config) {
        if (ghApi.access_token) {
            config.headers.authorization = 'token ' + ghApi.access_token;
        }

        return config;
      },
      response: function(response){
        ghApi.rateLimit.remaining = response.headers('X-RateLimit-Remaining');
        ghApi.rateLimit.limit = response.headers('X-RateLimit-Limit');
        ghApi.rateLimit.reset = response.headers('X-RateLimit-Reset');
        return response;
      }
    };
  });
