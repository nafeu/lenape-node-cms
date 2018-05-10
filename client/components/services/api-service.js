'use strict';

app.service('apiService', function($http) {
  this.test = function(url) {
    return $http.get(url);
  }

  this.createWord = function(payload) {
    var url = "/api/word";
    return $http.post(url, payload);
  }

  this.getAllWords = function() {
    var url = "/api/words";
    return $http.get(url);
  }

  this.getWord = function(wordId) {
    var url = "/api/word?wordId=" + wordId;
    return $http.get(url);
  }

  this.uploadAudio = function(blob) {
    var fd = new FormData();
    fd.append('name', 'testupload');
    fd.append('track', blob);
    return $.ajax({
      type: 'POST',
      url: '/api/upload',
      data: fd,
      processData: false,
      contentType: false
    });
  }
});
