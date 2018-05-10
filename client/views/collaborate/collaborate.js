'use strict';

angular.module('myApp.collaborate', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/collaborate', {
    templateUrl: 'views/collaborate/collaborate.html',
    controller: 'CollaborateCtrl'
  });
}])

.controller('CollaborateCtrl', ['$scope', 'apiService', 'storageService', function($scope, apiService, storageService) {

  $scope.chalk = {
    lineWidth: 4,
    color: "white"
  };

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