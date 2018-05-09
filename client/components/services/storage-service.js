'use strict';

app.service('storageService', ['STORAGE_ID', function(storageId) {
  var storageKey = storageId + '-appData';
  this.get = function(key) {
    if (window.localStorage.getItem(storageKey)) {
      return JSON.parse(window.localStorage.getItem(storageKey))[key];
    }
    return null;
  }
  this.set = function(key, value) {
    var appData = JSON.parse(window.localStorage.getItem(storageKey));
    if (!appData) {
      appData = {};
    }
    appData[key] = value;
    window.localStorage.setItem(storageKey, JSON.stringify(appData));
  }
  this.export = function() {
    if (window.localStorage.getItem(storageKey)) {
      return window.btoa(window.localStorage.getItem(storageKey));
    }
  }
  this.load = function(dataString, callback) {
    window.localStorage.setItem(storageKey, window.atob(dataString));
    if (callback) {
      callback();
    }
  }
  this.read = function() {
    return window.localStorage.getItem(storageKey);
  }
}]);
