var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

app.listen(6969, '10.100.0.143');
var game = null;
var players = {};
io.sockets.on('connection', function (socket) {
  socket.set('uid', h.generateUid());

  if (!game) {
    socket.emit('new');
  } else {
    socket.emit('old', game);
    socket.emit('playe', players);
  }

  socket.on('generated', function(data) {
    game = data;
  });

  //console.log(socket.get('uid'));
  socket.on('move', function(data) {
    socket.get('uid', function(err, uid) {
      //console.log(data, '===============================');
      socket.broadcast.emit('moved', {uid: uid, direction: data.direction, pipe: data.pipe});
      players[uid] = data.pipe;
    });

    game.state = data.state; 
    game.toRender = data.toRender;
  });

  socket.on('spawn', function(data) {
    socket.get('uid', function(err, uid) {
      socket.broadcast.emit('spawned', {uid: uid, pipe: data.pipe});
      players[uid] = data;
    });
    game.state = data.state;
    game.toRender = data.toRender;
  });

  socket.on('disconnect', function () {
    socket.get('uid', function(err, uid) {
      delete players[uid];
      socket.emit('disconnected', {uid: uid});
    });
  });

  socket.on('typeChange', function(data) {
    socket.get('uid', function(err, uid) {
      socket.broadcast.emit('typeChanged', {uid: uid, type: data});
    });
  })
});

function handler (req, res) {
}

var h = {
  generateUid: function() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
  }
}