'use strict';

angular.module('myApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'views/home/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', ['$scope', 'apiService', 'storageService', function($scope, apiService, storageService) {
  $scope.word = "";
  $scope.words = [];

  apiService.test("/api/test").then(function(res){
    console.log(res);
  });

  $scope.createWord = function(){
    apiService.createWord($scope.word).then(function(res){
      alert(JSON.stringify(res));
    })
  }

  apiService.getWords().then(function(res){
    console.log(res.data);
    $scope.words = res.data;
  }, function(res){
    alert(res);
  });

}]);