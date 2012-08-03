var assets = {
	init: function () {
		assets.c = new Array();
		assets.c[types.oriz] = new Image();
		assets.c[types.oriz].src = '/images/tava-dreapta.png';
		assets.c[types.vert] = new Image();
		assets.c[types.vert].src = '/images/tava-dreapta-vert.png';
		assets.c[types.leftUp] = new Image();
		assets.c[types.leftUp].src = '/images/tava-left-up.png';
		assets.c[types.leftDown] = new Image();
		assets.c[types.leftDown].src = '/images/tava-left-down.png';
		assets.c[types.rightUp] = new Image();
		assets.c[types.rightUp].src = '/images/tava-right-up.png';
		assets.c[types.rightDown] = new Image();
		assets.c[types.rightDown].src = '/images/tava-right-down.png';
	}
}

var types = {
	oriz: 1,
	vert: 2,
	leftUp: 3,
	leftDown: 4,
	rightUp: 5,
	rightDown: 6
};

var directions = {
	up: 38,
	down: 40,
	left: 37,
	right: 39
}

var keys = {
	leftArrow: 38,
	rightArrow: 40,
	downArrow: 37,
	upArrow: 39
};

var Pipe = function(type, row, col, connected) {
	this.typeChanges = 0;
	this.type = type;
	if (connected === undefined) {
		this.connected = false;
	} else {
		this.connected = connected;
	}
	this.block = new Block(row, col);
	this.top = function() {
		if (this.connected == directions.top) {
			return false;
		}
		return this.type == types.vert || this.type == types.leftUp || this.type == types.rightUp;
	}
	this.down = function() {
		if (this.connected == directions.down) {
			return false;
		}
		return this.type == types.vert || this.type == types.leftDown || this.type == types.rightDown;
	}
	this.left = function() {
		if (this.connected == directions.left) {
			return false;
		}
		return this.type == types.oriz || this.type == types.leftDown || this.type == types.leftUp;
	}
	this.right = function() {
		if (this.connected == directions.right) {
			return false;
		}
		return this.type == types.oriz || this.type == types.rightDown || this.type == types.rightUp;
	}
	this.typeTimer = function(pipe) {
		pipe.typeChanges++;
		if (pipe.typeChanges == game.maxTypeChanges){
			game.state[game.myPipe.block.row][game.myPipe.block.col] = false;
			game.myPipe = null;
			return;
		}
		if (game.alwaysCorrect) {
			//console.log(game.lastPipe);
			//console.log(pipe);
			var lastType = pipe.type;
			do {
				pipe.type = h.getRandomInt(1,6);
			} while (!pipe.matchPipe(game.lastPipe) && lastType != pipe.type);
		} else {
			pipe.type = h.getRandomInt(1,6);
		}
		socket.emit('typeChange', pipe.type);
		pipe.timer = setTimeout(pipe.typeTimer, game.timeoutCount, pipe);
	}
	this.moveTo = function(direction, sync) {
		if (sync === undefined) {
			sync = false;
		}
		if (this.block.moving) {
			return false;
		}

		initialX = this.block.x;
		initialY = this.block.y;
		if (direction == directions.up && game.available(this.block.row-1, this.block.col)) {
			game.state[this.block.row][this.block.col] = false;
			// this.block.setRow(this.block.row-1);
			if (!sync) {
				socket.emit('move', {direction: direction, pipe: this, toRender: game.toRender, state: game.state});
			}
			game.animate(this, this.block.x, h.xByCol(this.block.row-1), direction);
			game.state[this.block.row-1][this.block.col] = this;

		} else if (direction == directions.down && game.available(this.block.row+1, this.block.col)) {
			game.state[this.block.row][this.block.col] = false;
			// this.block.truesetRow(this.block.row+1);
			if (!sync) {
				socket.emit('move', {direction: direction, pipe: this, toRender: game.toRender, state: game.state});
			}
			game.animate(this, this.block.x, h.xByCol(this.block.row+1), direction);
			// console.log(direction);
			game.state[this.block.row+1][this.block.col] = this;

		} else if (direction == directions.right && game.available(this.block.row, this.block.col+1)) {
			game.state[this.block.row][this.block.col] = false;
			// this.block.setCol(this.block.col+1);
			if (!sync) {
				socket.emit('move', {direction: direction, pipe: this, toRender: game.toRender, state: game.state});
			}
			game.animate(this, h.xByCol(this.block.col+1), this.block.y, direction);
			game.state[this.block.row][this.block.col+1] = this;

		} else if (direction == directions.left && game.available(this.block.row, this.block.col-1)) {
			game.state[this.block.row][this.block.col] = false;
			// this.block.setCol(this.block.col-1);
			if (!sync) {
				socket.emit('move', {direction: direction, pipe: this, toRender: game.toRender, state: game.state});
			}
			game.animate(this, h.xByCol(this.block.col-1), this.block.y, direction);
			game.state[this.block.row][this.block.col-1] = this;

		} else {
			console.log("unexpected");
		}
	}

	this.matchPipe = function(pipe) {
		return (this.top() && pipe.down())
				|| (this.down() && pipe.top())
				|| (this.left() && pipe.right())
				|| (this.right() && pipe.left());
	}

	this.afterMove = function() {
		if ((this.top() && game.checkUp(this.block.row, this.block.col))
			|| (this.down() && game.checkDown(this.block.row, this.block.col))
			|| (this.right() && game.checkRight(this.block.row, this.block.col))
			|| (this.left() && game.checkLeft(this.block.row, this.block.col))
			) {
			
			if (this.timer) {
				clearTimeout(this.timer);
			}

			game.lastPipe = this;
			game.toRender.push(this);
			if (this == game.myPipe)
				game.myPipe = null;
			else
				delete this;
		}
		if (this.top() && game.checkUp(this.block.row, this.block.col)) {
			this.connected = directions.up;
		} else if (this.down() && game.checkDown(this.block.row, this.block.col)) {
			this.connected = directions.down;
		} else if (this.right() && game.checkRight(this.block.row, this.block.col)) {
			this.connected = directions.right;
		} else if (this.left() && game.checkLeft(this.block.row, this.block.col)) {
			this.connected = directions.left;
		}
		if (this.block.col == game.cols-1 && this.right() && this.connected) {
			clearInterval(game.loopObj);
			alert("jocu' e gata.");
		}
		// if ()
	}

	this.draw = function() {
		if(this.connected){
			game.ctx.fillStyle = "rgb(200, 200, 220)"; 
			game.ctx.fillRect(this.block.x, this.block.y, game.pipeSize, game.pipeSize);
			
		}
		game.ctx.drawImage(assets.c[this.type], this.block.x, this.block.y, game.pipeSize, game.pipeSize);
	}

}

var Block = function(row, col) {
	this.moving = false;

	this.setX = function(x) {
	 	this.x = x;
	 	this.col = x / game.pipeSize;
	}

	this.setY = function(y) {
		this.y = y;
		this.row = y / game.pipeSize;
	}

	this.setCol = function(col) {
		this.col = col;
		this.x = col * game.pipeSize;
	}

	this.setRow = function(row) {
		this.row = row;
		this.y = row * game.pipeSize;
	}
	this.row = row;
	this.col = col;
	this.x = col * game.pipeSize;
	this.y = row * game.pipeSize;
}

// var Obstacle = function (asset, row, col, noRows, noCols) {
// 	this.top = function() {
// 		return false;
// 	};
// 	this.down = function() {
// 		return false;
// 	};
// 	this.left = function() {
// 		return false;
// 	};
// 	this.right = function() {
// 		return false;
// 	};
// 	this.asset = asset;
// 	this.cols = noCols;
// 	this.rows = noRows;
// 	this.block = new Block(row, col);
// 	this.put = function() {
// 		this.
// 	}
// }

var game = {
	rows: 12,
	cols: 20,
	pipeSize: 40,
	canvas: null,
	ctx: null,
	state: null,
	fps: 25,
	myPipe: null,
	timeoutCount: 3000,
	speed: 11,
	alwaysCorrect: true,
	lastPipe: null,
	maxTypeChanges: 3,
	highScoreBlock: null,
	alignPixels: 5,
	firstBlock: null,
	toRender: new Array(),
	init: function () {
		game.canvas = document.getElementById('game');

		game.ctx = game.canvas.getContext('2d');

		game.width = game.pipeSize * game.cols;
		game.height = game.pipeSize * game.rows;
		game.canvas.width = game.width;
		game.canvas.height = game.height;
		game.littlePipeSize = game.pipeSize - game.alignPixels;

		game.state = new Array();
		for (var i=0; i<game.rows; i++) {
			game.state[i] = new Array();
			for (j=0; j<game.cols; j++) {
				game.state[i][j] = false;
			}
		}
		assets.init();
	},

	initMultiplayer: function(data) {
		game.rows = data.rows;
		game.cols = data.cols;


		// game.toRender = data.toRender;
		for(var i in data.toRender) {
			arr = data.toRender[i];
			obj = new Pipe(arr.type, arr.block.row, arr.block.col, arr.connected);
			game.toRender.push(obj);
		}

		game.maxTypeChanges = data.maxTypeChanges;
		// console.log(data.toRender);
		game.highScoreBlock = data.highScoreBlock;
		game.lastPipe = new Pipe(data.lastPipe.type, data.lastPipe.block.row, data.lastPipe.block.col, data.lastPipe.connected);
		game.speed = data.speed;
		game.alwaysCorrect = data.alwaysCorrect;
		game.firstBlock = data.firstBlock;
		game.init();

		for (var i=0; i<game.rows; i++) {
			for(var j=0; j<game.cols; j++) {
				if (data.state[i][j]) {
					arr = data.state[i][j];

					var obj = new Pipe(arr.type, arr.block.row, arr.block.col, arr.connected);

					game.state[i][j] = obj; 

				}

			}
		}
	},

	generate: function() {
		rndRow = h.getRandomInt(0,(game.rows-1));
		p = new Pipe(types.oriz, rndRow, 0, directions.left);
		game.firstBlock = rndRow;

		game.lastPipe = p;
		game.state[rndRow][0] = p;
		game.toRender.push(p);

		rndRow = h.getRandomInt(0,(game.rows-1));
		game.highScoreBlock = rndRow;
	},

	onKeyDown: function(evt) {
		// console.log("bau")
		if (game.myPipe) {
			game.myPipe.moveTo(evt.keyCode);
		}
		return false;
	},

	makeLayout: function() {
		game.ctx.fillStyle = '#679ed2';
		game.ctx.fillRect(0, 0, game.ctx.canvas.width,game.ctx.canvas.height);
		for(var i=0; i<game.rows; i++){
			game.ctx.fillStyle = '#FFFFE0';
			game.ctx.fillRect((game.cols-1) * game.pipeSize, i * game.pipeSize, game.pipeSize, game.pipeSize);
			game.ctx.fillStyle = '#FADADD';
			game.ctx.fillRect((game.cols-1) * game.pipeSize, game.highScoreBlock * game.pipeSize, game.pipeSize, game.pipeSize)
		}
		for (var i=0; i<=game.rows; i++) {
			game.ctx.beginPath();
		    game.ctx.moveTo(0, i*game.pipeSize);
		    game.ctx.lineTo(game.width, i*game.pipeSize);
		    game.ctx.closePath();
		    game.ctx.stroke();
		}
		for (var i=0; i<=game.cols; i++) {
			game.ctx.beginPath();
			game.ctx.moveTo(i*game.pipeSize, 0);
			game.ctx.lineTo(i*game.pipeSize, game.height);
			game.ctx.closePath();
			game.ctx.stroke();
		}
	},

	available: function(row, col) {
		if (row < 0 || row > (game.rows-1) || col < 0 || col > (game.cols-1)) {
			return false;
		}
		if (game.state[row][col]) {
			return false;
		}
		return true;
	},

	checkDown: function(row, col) {
		return game.state[row+1] && game.state[row+1][col] && game.state[row+1][col].top() && game.state[row+1][col].connected;
	},

	checkUp: function(row, col) {
		return game.state[row-1] && game.state[row-1][col] && game.state[row-1][col].down() && game.state[row-1][col].connected;
	},

	checkLeft: function(row, col) {
		return game.state[row] && game.state[row][col-1] && game.state[row][col-1].right() && game.state[row][col-1].connected;
	},

	checkRight: function(row, col) {
		return game.state[row] && game.state[row][col+1] && game.state[row][col+1].left() && game.state[row][col+1].connected;
	},

	animate: function(obj, x, y, dir) {
		obj.block.moving = setInterval(function() {
			if (dir == directions.right) {
				if (obj.block.x >= x) {
					clearInterval(obj.block.moving);
					obj.block.setX(x);
					obj.block.moving = false;
					obj.afterMove();
				} else {
					obj.block.setX(obj.block.x + game.speed);
				}
			} else if (dir == directions.left) {
				if (obj.block.x <= x) {
					clearInterval(obj.block.moving);
					obj.block.setX(x);
					obj.block.moving = false;
					obj.afterMove();
					// console.log("stanga stopped");
				} else {
					obj.block.setX(obj.block.x - game.speed);
					// console.log("stanga ... ");
				}
			} else if (dir == directions.down) {
				
				if (obj.block.y >= y) {
					clearInterval(obj.block.moving);
					obj.block.setY(y);
					obj.block.moving = false;
					obj.afterMove();
				} else {
					obj.block.setY(obj.block.y + game.speed);
				}
			} else if (dir == directions.up) {
				if (obj.block.y <= y) {
					clearInterval(obj.block.moving);
					obj.block.setY(y);
					obj.block.moving = false;
					obj.afterMove();
				} else {
					obj.block.setY(obj.block.y - game.speed);
				}
			}
		}, game.fps);
	},

	loopObj: false,
	renderPlayers: function() {
		for (var i in players) {
			//console.log(playerColors[i]);
			game.ctx.fillStyle = playerColors[i];
			game.ctx.fillRect(players[i].block.x, players[i].block.y, 40, 40);
			players[i].draw();
		}
	},
	loop: function() {
		console.log("loop :) ");
		game.loopObj = setInterval(function() {
			game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height)
			game.makeLayout();
			game.renderPlayers();

			for(var i in game.toRender) {
				// console.log(i);
				game.toRender[i].draw();
			}

			// console.log(game.toRender);

			if (game.myPipe == null) {
				do {
					rndRow = h.getRandomInt(0, game.rows-1);
					rndCol = h.getRandomInt(0, game.cols-1);
				} while (game.state[rndRow][rndCol]);
				if (game.alwaysCorrect) {
					do {
						game.myPipe = new Pipe(h.getRandomInt(1,6), rndRow, rndCol);
					} while (game.myPipe.matchPipe(game.lastPipe));
				} else {
					game.myPipe = new Pipe(h.getRandomInt(1,6), rndRow, rndCol);
				}
				socket.emit('spawn', {pipe: game.myPipe, toRender: game.toRender, state: game.state});
				game.myPipe.typeTimer(game.myPipe);
			} else {
				game.myPipe.draw();
			}
		}, game.fps);
	}
};

var h = {
	xByCol: function(col) {
		return col * game.pipeSize;
	},
	colByX: function(x) {
		return x / game.pipeSize;
	},
	getRandomInt: function (min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	getColor: function() {
		return 'rgb('+h.getRandomInt(150,255)+','+h.getRandomInt(150,255)+','+h.getRandomInt(150,255)+')';
	}
}

// window.addEventListener('load', function () {
// 	game.init();
// 	game.loop();
// }, false);

var players = [];
var playerColors = [];

window.addEventListener('keydown', game.onKeyDown, true);


var socket = io.connect('http://10.100.0.143:6969');
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
socket.on('old', function(data) {
	game.initMultiplayer(data);
	game.loop();
});
socket.on('moved', function(data) {
	if (!players[data.uid]) {
		//players[data.uid] = new Pipe();
		console.log('nasol moment. nu e player [data.uid]');
	} else {
		players[data.uid].moveTo(data.direction, true);
	}
});
socket.on('spawned', function(data) {
	if (players[data.uid] && !players[data.uid].connected) {
		// do the respawn with players[data.uid]
		old = players[data.uid];
		game.state[old.block.row][old.block.col] = false;
		players[data.uid] = new Pipe(data.pipe.type, data.pipe.block.row, data.pipe.block.col);
		game.state[players[data.uid].block.row][players[data.uid].block.col] = players[data.uid];

	} else {
		// simply put that mofo there
		players[data.uid] = new Pipe(data.pipe.type, data.pipe.block.row, data.pipe.block.col);
		game.state[players[data.uid].block.row][players[data.uid].block.col] = players[data.uid];
	}
});
socket.on('playe', function(data) {
	console.log(data);
	for (var i in data) {
		console.log(data[i]);
		players[i] = new Pipe(data[i].type, data[i].block.row, data[i].block.col);
		playerColors[i] = h.getColor();
	}
});
socket.on('typeChanged', function(data) {
	players[data.uid].type = data.type;
});
socket.on('disconnected', function(data) {
	delete players[data.uid];
	delete playerColors[data.uid];
});