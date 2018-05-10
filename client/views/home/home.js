'use strict';

angular.module('myApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: 'views/home/home.html',
    controller: 'HomeCtrl'
  });
}])

.controller('HomeCtrl', ['$scope', 'apiService', 'storageService', function($scope, apiService, storageService) {
  $scope.name = "";
  $scope.audioId = "";

  $scope.snapshots = [];

  $scope.createWord = function(){
    var payload = {
      name: $scope.name,
      audioId: $scope.audioId,
      snapshots: $scope.snapshots
    };
    apiService.createWord(payload).then(function(res){
      alert(JSON.stringify(res));
    })
  }

  $scope.takeSnapshot = function(){
    var encodedImage = exportCanvasState();
    $scope.snapshots.push(encodedImage);
  }

  // apiService.getWords().then(function(res){
  //   console.log(res.data);
  //   $scope.words = res.data;
  // }, function(res){
  //   alert(res);
  // });

  var record = document.querySelector('.record');
  var stop = document.querySelector('.stop');
  var soundClips = document.querySelector('.sound-clips');
  var mainSection = document.querySelector('.main-controls');

  // disable stop button while not recording

  stop.disabled = true;

  //main block for doing the audio recording

  if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');

    var constraints = { audio: true };
    var chunks = [];

    var onSuccess = function(stream) {
      var mediaRecorder = new MediaRecorder(stream);

      record.onclick = function() {
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        record.style.background = "red";

        stop.disabled = false;
        record.disabled = true;
      }

      stop.onclick = function() {
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log("recorder stopped");
        record.style.background = "";
        record.style.color = "";
        // mediaRecorder.requestData();

        stop.disabled = true;
        record.disabled = false;
      }

      mediaRecorder.onstop = function(e) {
        console.log("data available after MediaRecorder.stop() called.");

        var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
        console.log(clipName);
        var clipContainer = document.createElement('article');
        var clipLabel = document.createElement('p');
        var audio = document.createElement('audio');
        var deleteButton = document.createElement('button');

        clipContainer.classList.add('clip');
        audio.setAttribute('controls', '');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';

        if(clipName === null) {
          clipLabel.textContent = 'My unnamed clip';
        } else {
          clipLabel.textContent = clipName;
        }

        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(deleteButton);
        soundClips.appendChild(clipContainer);

        audio.controls = true;
        var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        apiService.uploadAudio(blob).then(function(res){
          console.log("Audio upload successful, here is the ID:");
          console.log(res.audioId);
          $scope.audioId = res.audioId;
        });
        var audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        console.log("recorder stopped");

        deleteButton.onclick = function(e) {
          evtTgt = e.target;
          evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        }

        clipLabel.onclick = function() {
          var existingName = clipLabel.textContent;
          var newClipName = prompt('Enter a new name for your sound clip?');
          if(newClipName === null) {
            clipLabel.textContent = existingName;
          } else {
            clipLabel.textContent = newClipName;
          }
        }
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
    // var img=new Image();
    // img.src=theDataURL;
    // context.drawImage(img,0,0);
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
  console.log(scale);

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