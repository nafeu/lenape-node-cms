'use strict';

angular.module('myApp.analyze', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/analyze', {
    templateUrl: 'views/analyze/analyze.html',
    controller: 'AnalyzeCtrl'
  });
}])

.controller('AnalyzeCtrl', [function() {

}]);