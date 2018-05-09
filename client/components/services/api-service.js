'use strict';

app.service('apiService', function($http) {
  this.test = function(url) {
    return $http.get(url);
  }

  this.createWord = function(word) {
    var url = "/api/word";
    return $http.post(url, {name: word});
  }

  this.getWords = function() {
    var url = "/api/word";
    return $http.get(url);
  }
});
