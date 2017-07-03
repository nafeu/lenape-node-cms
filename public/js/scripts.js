var socket = io({
  'reconnection': false
});

socket.on('new connection', function(data){
  console.log("connected with id: " + data.id);
})

$(document).ready(function(){
  console.log("Document is ready...");
})