var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('./index.html');
});

io.on('connection', function(socket){

  socket.on('join', function(screenName){
    socket.screenName = screenName;
    io.emit('chat message', socket.screenName+' has connected');
  });


  socket.on('chat message', function(msg){
    io.emit('chat message', socket.screenName + ": "+msg);
    console.log('message: ' + msg);
  });

  socket.on('disconnect', function(){
    console.log(socket.screenName + ' disconnected');
    io.emit('chat message', socket.screenName+' disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
