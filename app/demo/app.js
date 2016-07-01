angular.module('app', ['ngMaterial'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('blue');
})
.controller('appController', function ($http) {
    var $ctrl = this;
    $ctrl.data = {
        '2015-2016': {
            'PT': {},
            'TPart': {}
        }
    };
    Object.keys($ctrl.data).forEach(function (year, idxYear) {
        Object.keys($ctrl.data[year]).forEach(function (t, idxT) {
            $http.get(year + '/' + t + '/data.txt')
            .then(function (result) {
                result.data.split('\n').forEach(function(p){
                    var pt = p.split(/-(.+)?/);
                    if (!$ctrl.data[year][t].hasOwnProperty(pt[0])) {
                        $ctrl.data[year][t][pt[0]] = [];
                    }
                    $ctrl.data[year][t][pt[0]].push(pt[1]);
                    $ctrl.pt = pt[0];
                });
                $ctrl.idxPt = Object.keys($ctrl.data[year][t]).length -1;
            });
            $ctrl.t = t;
            $ctrl.idxT = idxT;
        });
        $ctrl.year = year;
        $ctrl.idxYear = idxYear;
    });
});