'use strict';

angular.module('myApp.record', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/record/:word_id', {
    templateUrl: 'views/record/recordDetail.html',
    controller: 'RecordDetailCtrl'
  });

  $routeProvider.when('/record', {
    templateUrl: 'views/record/record.html',
    controller: 'RecordCtrl'
  });

  $routeProvider.when('/new', {
    templateUrl: 'views/record/recordNew.html',
    controller: 'RecordNewCtrl'
  });
}])

.controller('RecordCtrl', ['$scope', 'apiService', '$location', function($scope, apiService, $location) {

  $scope.words = [];

  $scope.go = function ( path ) {
    $location.path( path );
  };

  apiService.getAllWords().then(function(res){
    console.log("retrieving all words...");
    console.log(res.data);
    $scope.words = res.data;
  })
}])

.controller('RecordNewCtrl', ['$scope', 'apiService', '$location', function($scope, apiService, $location) {
  $scope.englishName = "";
  $scope.definition = "";
  $scope.notes = "";

  $scope.createWord = function(){
    var payload = {
      englishName: $scope.englishName,
      definition: $scope.definition,
      notes: $scope.notes
    };
    apiService.createWord(payload).then(function(res){
      alert(res.data.message);
      $location.path('/record');
    })
  }
}])

.controller('RecordDetailCtrl', ['$scope', 'apiService', 'storageService', '$routeParams', '$location', function($scope, apiService, storageService, $routeParams, $location) {
  $scope.wordId = $routeParams.word_id;
  $scope.name = "";
  $scope.definition = "";
  $scope.englishName = "";
  $scope.audioId = "";
  $scope.notes = "";
  $scope.snapshots = [];
  $scope.snapshotIds = [];

  apiService.getWord($scope.wordId).then(function(res){
    $scope.name = res.data.name;
    $scope.definition = res.data.definition;
    $scope.englishName = res.data.englishName;
    $scope.notes = res.data.notes;
  })

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
        $location.path('/record');
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
        startRecording();
      }

      stop.onclick = function() {
        stopRecording();
      }

      mediaRecorder.onstop = function(e) {
        $scope.blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        var audio = document.querySelector('#audio-player');
        audio.src = window.URL.createObjectURL($scope.blob);
        chunks = [];
      }

      function startRecording() {
        $scope.recording = true;
        mediaRecorder.start();
        record.style.borderColor = "red";

        stop.disabled = false;
        record.disabled = true;
        checkRecording();
      }

      function checkRecording() {
        setTimeout(function(){
          if ($scope.recording == true && $scope.recordingCounter > 1) {
            $scope.recordingCounter--;
            checkRecording();
          } else if ($scope.recording == true) {
            stopRecording();
          }
        }, 1000)
      }

      function stopRecording() {
        $scope.recording = false;
        $scope.recordingCounter = 15;
        mediaRecorder.stop();
        record.style.borderColor = "";
        record.style.color = "";
        // mediaRecorder.requestData();

        stop.disabled = true;
        record.disabled = false;
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