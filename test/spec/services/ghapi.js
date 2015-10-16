'use strict';

describe('Service: ghApi', function () {

  // load the service's module
  beforeEach(module('githubClassroomDashboardApp'));

  // instantiate service
  var ghApi;
  beforeEach(inject(function (_ghApi_) {
    ghApi = _ghApi_;
  }));

  it('should do something', function () {
    expect(!!ghApi).toBe(true);
  });

});
