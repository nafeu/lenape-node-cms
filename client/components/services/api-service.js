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

  this.uploadAudio = function(blob) {
    // var url = "/api/upload";
    // var fd = new FormData();

    // fd.append('name', "TESTNAME");
    // fd.append('file', blob);

    // return $http.post(url, fd, {
    //   transformRequest: angular.identity,
    //   headers: { 'Content-Type': undefined }
    // });
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
