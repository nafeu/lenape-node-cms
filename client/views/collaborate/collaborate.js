'use strict';

angular.module('myApp.collaborate', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/collaborate', {
    templateUrl: 'views/collaborate/collaborate.html',
    controller: 'CollaborateCtrl'
  });
}])

.controller('CollaborateCtrl', ['$scope', 'apiService', 'storageService', '$routeParams', function($scope, apiService, storageService, $routeParams) {
  $scope.blob;
  $scope.chalk = {
    lineWidth: 4,
    color: "white"
  };

  $scope.setTool = function(setting) {
    switch(setting) {
      case "white":
        $scope.chalk.lineWidth = 4;
        $scope.chalk.color = "white";
        break;
      case "blue":
        $scope.chalk.lineWidth = 4;
        $scope.chalk.color = "blue";
        break;
      case "green":
        $scope.chalk.lineWidth = 4;
        $scope.chalk.color = "green";
        break;
      case "red":
        $scope.chalk.lineWidth = 4;
        $scope.chalk.color = "red";
        break;
      case "yellow":
        $scope.chalk.lineWidth = 4;
        $scope.chalk.color = "yellow";
        break;
      case "eraser":
        $scope.chalk.lineWidth = 30;
        $scope.chalk.color = "black";
        break;
      default:
        break;
    }
  }

  $scope.recording = false;
  $scope.recordingCounter = 15;

  $scope.saveWord = function(){
    apiService.uploadAudio($scope.blob).then(function(res){
      alert(JSON.stringify(res));
      $scope.audioId = res.audioId;
      var payload = {
        wordId: $scope.wordId,
        name: $scope.name,
        audioId: $scope.audioId,
        snapshotIds: $scope.snapshotIds,
        isQueued: true,
        isProcessed: false
      };
      apiService.saveWord(payload).then(function(res){
        alert(JSON.stringify(res));
      })
    });
  }

  $scope.takeSnapshot = function(){
    var encodedImage = exportCanvasState();
    apiService.createSnapshot(encodedImage).then(function(res){
      console.log("Creating snapshot");
      console.log(res);
      $scope.snapshotIds.push(res.data.snapshotId);
      $scope.snapshots.push(encodedImage);
    });
  }

  $scope.clearCanvas = function() {
    if (confirm("Are you sure you want to clear the board?")) {
      clear();
    } else {
      // do nothing...
    }
  }

  var socket = io();
  var canvas = document.getElementsByClassName('chalkboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var inMemCanvas = document.createElement('canvas');
  var inMemCtx = inMemCanvas.getContext('2d');
  var exportCanvas = document.createElement('canvas');
  var exportCtx = exportCanvas.getContext('2d');

  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);
  socket.on('clear', onClearEvent);

  socket.emit('getLastCanvasState');

  socket.on('getLastCanvasState', function(data){
    var img=new Image();
    img.src=data;
    setTimeout(function(){
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }, 1000);
  })

  window.addEventListener('resize', onResize, false);
  onResize();

  function drawLine(x0, y0, x1, y1, color, lineWidth, emit){
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      lineWidth: lineWidth,
      color: color
    });
  }

  function clear() {
    socket.emit('clear');
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('setLastCanvasState', exportCanvasState());
  }

  var scale = window.innerWidth / canvas.getBoundingClientRect().width;

  function onMouseDown(e){
    drawing = true;
    var rect = canvas.getBoundingClientRect();
    $scope.chalk.x = (e.clientX - rect.left) * scale;
    $scope.chalk.y = (e.clientY - rect.top) * scale;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    var rect = canvas.getBoundingClientRect();
    drawLine($scope.chalk.x, $scope.chalk.y, (e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, $scope.chalk.color, $scope.chalk.lineWidth, true);
    socket.emit('setLastCanvasState', exportCanvasState());
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    var rect = canvas.getBoundingClientRect();
    drawLine($scope.chalk.x, $scope.chalk.y, (e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, $scope.chalk.color, $scope.chalk.lineWidth, true);
    $scope.chalk.x = (e.clientX - rect.left) * scale;
    $scope.chalk.y = (e.clientY - rect.top) * scale;
  }

  function onColorUpdate(e){
    $scope.chalk.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.lineWidth);
  }

  function onClearEvent() {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // make the canvas fill its parent
  function onResize() {
    inMemCanvas.width = canvas.width;
    inMemCanvas.height = canvas.height;
    inMemCtx.drawImage(canvas, 0, 0);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.drawImage(inMemCanvas, 0, 0, canvas.width, canvas.height);
    scale = window.innerWidth / canvas.getBoundingClientRect().width
  }

  function exportCanvasState() {
    exportCanvas.width = canvas.width / 3;
    exportCanvas.height = canvas.height / 3;
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    return exportCanvas.toDataURL();
  }

}]);