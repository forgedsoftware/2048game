
var Game2048Visual = function (control, scoreControl, size) {
	this.game = new Game2048(4);
	this.control = control;
	this.scoreControl = scoreControl;
	this.size = size;
	this.fps = 60;
}

Game2048Visual.prototype.start = function () {
	var self = this;
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.size;
	this.canvas.height = this.size;

	this.context = this.canvas.getContext("2d");

	this.control.appendChild(this.canvas);

	this.game.start();

	window.addEventListener('keydown', function (event) {
		switch (event.keyCode) {
		case 37: // Left
			self.game.moveLeft();
			break;

		case 38: // Up
			self.game.moveUp();
			break;

		case 39: // Right
			self.game.moveRight();
			break;

		case 40: // Down
			self.game.moveDown();
			break;
		}
		self.scoreControl.innerHTML = self.game.score;
	}, false);

	var onEachFrameFunc = onEachFrame(this);
	onEachFrameFunc((this.run)());
};

Game2048Visual.prototype.run = function () {
	var loops = 0, skipTicks = 1000 / this.fps,
		maxFrameSkip = 10,
		nextGameTick = (new Date).getTime(),
		lastGameTick,
		self = this;

	return function() {
		loops = 0;

		while ((new Date).getTime() > nextGameTick) {
			nextGameTick += skipTicks;
			loops++;
		}

		if (loops) self.draw();
	}
};

Game2048Visual.prototype.restart = function () {
	this.game = new Game2048(4);
	this.game.start();
};

Game2048Visual.prototype.wait100 = function (cb) {
	setInterval(cb, 100);
}

Game2048Visual.prototype.draw = function () {
	// Clear
	this.context.clearRect(0, 0, this.size, this.size);
	// Draw Shell
	this.context.fillStyle = "gray";
	roundRect(this.context, 0, 0, this.size, this.size, 15, true, false)
	//this.context.fillRect(0, 0, this.size, this.size);
	this.context.fillStyle = "darkgray";
	var offsetSize = (this.size-20)/4;
	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < 4; j++) {
			var squareSize = offsetSize - 20;
			var x = i*offsetSize + 20;
			var y = j*offsetSize + 20;
			//this.context.fillRect(x, y, squareSize, squareSize);
			roundRect(this.context, x, y, squareSize, squareSize, 15, true, false)
		}
	}
	// Print Game Items
	for (var a = 0; a < 4; a++) {
		for (var b = 0; b < 4; b++) {
			var entry = this.game.board[b][a];
			if (entry) {
				var colors = this.colorForValue(entry.value);
				this.context.fillStyle = colors.bg;
				var squareSize = offsetSize - 20;
				var xVal = a*offsetSize + 20;
				var yVal = b*offsetSize + 20;
				//this.context.fillRect(xVal, yVal, squareSize, squareSize);
				roundRect(this.context, xVal, yVal, squareSize, squareSize, 15, true, false)
				var fontDetails = this.fontForValue(entry.value, squareSize);
				this.context.font = fontDetails.font;
				this.context.fillStyle = colors.txt;
				this.context.fillWeight = "bold";
				this.context.fillText(entry.value, xVal + fontDetails.xOffset, yVal + fontDetails.yOffset);
			}
		}
	}
};

/**
 * Draws a rounded rectangle using the current state of the canvas. 
 * If you omit the last three params, it will draw a rectangle 
 * outline with a 5 pixel border radius 
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate 
 * @param {Number} width The width of the rectangle 
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke == "undefined" ) {
		stroke = true;
	}
	if (typeof radius === "undefined") {
		radius = 5;
	}
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (stroke) {
		ctx.stroke();
	}
	if (fill) {
		ctx.fill();
	}        
}

Game2048Visual.prototype.fontForValue = function (value, squareSize) {
	var valueSize = value.toString().length;
	var size = (10 - valueSize)*4;
	var offset = [48, 36, 24, 18, 14, 12, 11, 11, 11]
	return {
		font: "bold " + size + "pt sans-serif",
		xOffset: offset[valueSize],
		yOffset: 70 - (valueSize * 2)
	}
}

Game2048Visual.prototype.colorForValue = function (value) {
	// Original tile colors - sourced from original game
	var colors = {
		"2": { bg: "#eee4da", txt: "#776e65" },
		"4": { bg: "#ede0c8", txt: "#776e65" },
		"8": { bg: "#f2b179", txt: "#f9f6f2" },
		"16": { bg: "#f59563", txt: "#f9f6f2" },
		"32": { bg: "#f67c5f", txt: "#f9f6f2" },
		"64": { bg: "#f65e3b", txt: "#f9f6f2" },
		"128": { bg: "#edcf72", txt: "#f9f6f2" },
		"256": { bg: "#edcc61", txt: "#f9f6f2" },
		"512": { bg: "#edc850", txt: "#f9f6f2" },
		"1024": { bg: "#edc53f", txt: "#f9f6f2" },
		"2048": { bg: "#edc22e", txt: "#f9f6f2" },

	};
	return colors["" + value] || { bg: "#3c3a32", txt: "#f9f6f2" };
}

function onEachFrame(self) {
	var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

	if (requestAnimationFrame) {
		return function (cb) {
			var _cb = function () { cb(); requestAnimationFrame(_cb); }
			_cb();
		};
	} else {
		return function (cb) {
			setInterval(cb, 1000 / self.fps);
		}
	}
}

window.Game2048Visual = Game2048Visual;