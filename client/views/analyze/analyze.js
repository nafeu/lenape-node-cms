'use strict';

angular.module('myApp.analyze', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/analyze', {
    templateUrl: 'views/analyze/analyze.html',
    controller: 'AnalyzeCtrl'
  });

  $routeProvider.when('/analyze/:word_id', {
    templateUrl: 'views/analyze/analyzeDetail.html',
    controller: 'AnalyzeDetailCtrl'
  });
}])

.controller('AnalyzeCtrl', ['$scope', 'apiService', function($scope, apiService) {
  $scope.words = []

  apiService.getAllWords().then(function(res){
    console.log("retrieving all words...");
    console.log(res.data);
    $scope.words = res.data;
  })
}])

.controller('AnalyzeDetailCtrl', ['$scope', '$routeParams', 'apiService', function($scope, $routeParams, apiService) {
  $scope.word = {};
  $scope.audioUrl = "";
  $scope.snapshots = [];
  apiService.getWord($routeParams.word_id).then(function(res){
    $scope.word = res.data;
    $scope.audioUrl = "/api/audio/" + res.data.audioId;
    var counter = 0;
    while (counter < $scope.word.snapshotIds.length) {
      apiService.getSnapshot($scope.word.snapshotIds[counter]).then(function(res){
        $scope.snapshots.push(res.data.dataUrl);
      });
      counter++;
    }
  })

}]);