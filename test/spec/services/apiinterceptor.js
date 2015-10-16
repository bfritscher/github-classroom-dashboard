'use strict';

describe('Service: apiInterceptor', function () {

  // load the service's module
  beforeEach(module('githubClassroomDashboardApp'));

  // instantiate service
  var apiInterceptor;
  beforeEach(inject(function (_apiInterceptor_) {
    apiInterceptor = _apiInterceptor_;
  }));

  it('should do something', function () {
    expect(!!apiInterceptor).toBe(true);
  });

});
