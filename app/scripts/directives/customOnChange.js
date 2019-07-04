'use strict';

/**
 * @ngdoc service
 * @name githubClassroomDashboardApp.apiInterceptor
 * @description
 * # apiInterceptor
 * Factory in the githubClassroomDashboardApp.
 */
angular.module('githubClassroomDashboardApp')
.directive('customOnChange', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.customOnChange);
        element.on('change', onChangeHandler);
        element.on('$destroy', function() {
          element.off();
        });

      }
    };
  });
