var socket = io.connect('http://localhost:6969');
// socket.on('news', function (data) {
//   console.log(data);
//   socket.emit('my other event', { my: 'data' });
// });
socket.on('new', function() {
	game.init();
	game.generate();
	game.loop();
	socket.emit('generated', game);
});
