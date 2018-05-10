'use strict';

angular.module('myApp.record', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/record', {
    templateUrl: 'views/record/record.html',
    controller: 'RecordCtrl'
  });
}])

.controller('RecordCtrl', ['$scope', 'apiService', 'storageService', function($scope, apiService, storageService) {
  $scope.name = "";
  $scope.audioId = "";

  $scope.snapshots = [];

  $scope.blob;
  $scope.blobUrl = "";

  $scope.createWord = function(){
    apiService.uploadAudio($scope.blob).then(function(res){
      alert(JSON.stringify(res));
      $scope.audioId = res.audioId;
      var payload = {
        name: $scope.name,
        audioId: $scope.audioId,
        snapshots: $scope.snapshots
      };
      apiService.createWord(payload).then(function(res){
        alert(JSON.stringify(res));
      })
    });
  }

  $scope.takeSnapshot = function(){
    var encodedImage = exportCanvasState();
    $scope.snapshots.push(encodedImage);
  }

  var record = document.querySelector('.record');
  var stop = document.querySelector('.stop');

  stop.disabled = true;

  if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');

    var constraints = { audio: true };
    var chunks = [];

    var onSuccess = function(stream) {
      var mediaRecorder = new MediaRecorder(stream);

      record.onclick = function() {
        mediaRecorder.start();
        record.style.background = "red";

        stop.disabled = false;
        record.disabled = true;
      }

      stop.onclick = function() {
        mediaRecorder.stop();
        record.style.background = "";
        record.style.color = "";
        // mediaRecorder.requestData();

        stop.disabled = true;
        record.disabled = false;
      }

      mediaRecorder.onstop = function(e) {
        $scope.blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        var audio = document.querySelector('#audio-player');
        audio.src = window.URL.createObjectURL($scope.blob);
        chunks = [];
      }

      mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
      }
    }

    var onError = function(err) {
      console.log('The following error occured: ' + err);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

  } else {
     console.log('getUserMedia not supported on your browser!');
  }

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');

  // Make our in-memory canvas
  var inMemCanvas = document.createElement('canvas');
  var inMemCtx = inMemCanvas.getContext('2d');

  var exportCanvas = document.createElement('canvas');
  var exportCtx = exportCanvas.getContext('2d');

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  console.log(canvas.getBoundingClientRect());

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);

  socket.emit('getLastCanvasState');

  socket.on('getLastCanvasState', function(data){
    var img=new Image();
    img.src=data;
    setTimeout(function(){
      console.log("drawing...");
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }, 1000);
  })

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 4;
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
      color: color
    });
  }

  var scale = window.innerWidth / canvas.getBoundingClientRect().width;

  function onMouseDown(e){
    drawing = true;
    var rect = canvas.getBoundingClientRect();
    current.x = (e.clientX - rect.left) * scale;
    current.y = (e.clientY - rect.top) * scale;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    var rect = canvas.getBoundingClientRect();
    drawLine(current.x, current.y, (e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, current.color, true);
    socket.emit('setLastCanvasState', exportCanvasState());
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    var rect = canvas.getBoundingClientRect();
    drawLine(current.x, current.y, (e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, current.color, true);
    current.x = (e.clientX - rect.left) * scale;
    current.y = (e.clientY - rect.top) * scale;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
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
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
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