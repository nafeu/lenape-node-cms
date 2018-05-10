'use strict';

angular.module('myApp.collaborate', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/collaborate', {
    templateUrl: 'views/collaborate/collaborate.html',
    controller: 'CollaborateCtrl'
  });
}])

.controller('CollaborateCtrl', [function() {

}]);