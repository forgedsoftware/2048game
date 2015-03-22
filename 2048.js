// Basic 2048 Implementation
// + Some solvers

var Game2048 = function (size) {
	this.size = size;
	this.board = [];
	this.turnHistory = [];
	this.winValue = 2048;
	this.baseValue = 2;
	this.currentTurn = -2;
	this.score = 0;

	for (var i = 0; i < this.size; i++) {
		this.board.push([])
		for (var j = 0; j < this.size; j++) {
			this.board[i].push(null);
		}
	}
}

Game2048.prototype.start = function () {
	if (this.currentTurn >= 0) {
		throw new Error('Game has already been started');
	}
	this.turnHistory.push({
		turnId: this.currentTurn++,
		add: this.addPiece(),
		changeCount: 0,
		direction: 'none'
	});
	this.turnHistory.push({
		turnId: this.currentTurn++,
		add: this.addPiece(),
		changeCount: 0,
		direction: 'none'
	});
};

Game2048.prototype.scoreLeft = function (points) {
	var self = this;
	return scoreMove(this, { isReversed: false, points: points }, function (i) {
		return self.board[i];
	});
}

Game2048.prototype.scoreRight = function (points) {
	var self = this;
	return scoreMove(this, { isReversed: true, points: points }, function (i) {
		return self.board[i];
	});
}

Game2048.prototype.scoreUp = function (points) {
	var self = this;
	return scoreMove(this, { isReversed: false, points: points }, function (i) {
		return generateColumn(self.board, i);
	});
}

Game2048.prototype.scoreDown = function (points) {
	var self = this;
	return scoreMove(this, { isReversed: true, points: points }, function (i) {
		return generateColumn(self.board, i);
	});
}

Game2048.prototype.move = function(direction) {
	switch (direction) {
		case 'left':
			return this.moveLeft();
		case 'right':
			return this.moveRight();
		case 'up':
			return this.moveUp();
		case 'down':
			return this.moveDown();
		default:
			throw new Error('Invalid direction specified');
	}
}

function scoreMove(self, config, getRowOrColumn) {
	var score = 0;
	for (var i = 0; i < self.size; i++) {
		var rowOrColumn = getRowOrColumn(i);
		var transformedArray = (config.isReversed) ? rowOrColumn.reverse() : rowOrColumn;
		// Points for empty spaces
		score += countNullSpaces(transformedArray) * config.points.emptySpace;
		var array = cleanArray(transformedArray);
		for (var j = 0; j < array.length; j++) {
			if (array[j] && array[j+1] && array[j].value === array[j+1].value) {
				// Merge
				score += config.points.merge;
			}
		}
	}
	return score;
}

Game2048.prototype.moveLeft = function () {
	return processHorizontalMove(this, { isReversed: false, direction: 'left' });
};

Game2048.prototype.moveRight = function () {
	return processHorizontalMove(this, { isReversed: true, direction: 'right' });
};

Game2048.prototype.moveUp = function () {
	return processVerticalMove(this, { isReversed: false, direction: 'up' });
};

Game2048.prototype.moveDown = function () {
	return processVerticalMove(this, { isReversed: true, direction: 'down' });
};

function processHorizontalMove (self, config) {
	return processMove(self, config, function (i) {
		return self.board[i];
	}, function (i, j, value) {
		self.board[i][j] = value;
	});
}

function processVerticalMove (self, config) {
	return processMove(self, config, function (i) {
		return generateColumn(self.board, i);
	}, function (i, j, value) {
		self.board[j][i] = value;
	});
}

function processMove (self, config, getRowOrColumn, insertValue) {
	// Check if game has been started
	if (self.currentTurn < 0) {
		throw new Error('Game needs to be started first');
	}

	var countChanges = 0;
	for (var i = 0; i < self.size; i++) {
		var rowOrColumn = getRowOrColumn(i);
		var transformedArray = (config.isReversed) ? rowOrColumn.reverse() : rowOrColumn;
		countChanges += countNullSpaces(transformedArray);
		var array = cleanArray(transformedArray);
		for (var j = 0; j < array.length; j++) {
			if (array[j] && array[j+1] && array[j].value === array[j+1].value) {
				// Do a merge
				array[j].value += array[j+1].value;
				array[j+1] = null;
				self.score += array[j].value;
				countChanges++;
			}
		}

		// Tidy Row
		var cleanedArray = cleanArray(array);
		var finalArray = (config.isReversed) ? cleanedArray.reverse() : cleanedArray;

		// Add Padding
		var paddingCount = self.size - finalArray.length;
		for (var k = 0; k < paddingCount; k++) {
			(config.isReversed) ? finalArray.splice(0, 0, null) : finalArray.push(null);
		}

		// Push Values Back
		for (var m = 0; m < self.size; m++) {
			insertValue(i, m, finalArray[m]);
		}
	}
	
	// If any pieces have moved
	if (countChanges > 0) {
		self.turnHistory.push({
			turnId: self.currentTurn++,
			add: self.addPiece(),
			changeCount: countChanges,
			direction: config.direction
		});
		return true;
	} else {
		return false;
	}
}

Game2048.prototype.addPiece = function () {
	// Decide Value
	var value = this.baseValue;
	var valueSeed = Math.floor(Math.random() * 5);
	if (valueSeed === 0) { // 20% chance of 4, otherwise 2
		value = value * 2;
	}

	// Decide Position
	var freeSpaces = this.countFreeSpaces();
	if (freeSpaces === 0) {
		throw new Error('Can\'t add a piece to a full game board');
	}
	var position = Math.floor(Math.random() * freeSpaces);

	// Place Piece
	var xVal, yVal;
	var curPos = 0;
	for (var i = 0; i < this.size; i++) {
		for (var j = 0; j < this.size; j++) {
			if (this.board[i][j] === null) {
				if (curPos === position) {
					this.board[i][j] = { value: value };
					xVal = i;
					yVal = j;
				}
				curPos++;
			}
		}
	}

	return {
		x: xVal,
		y: yVal,
		value: value
	};

	// Limitation: If undo is implemented, this will change position each time.
};

Game2048.prototype.countFreeSpaces = function () {
	var count = 0;
	for (var i = 0; i < this.size; i++) {
		for (var j = 0; j < this.size; j++) {
			if (this.board[i][j] === null) {
				count++;
			}
		}
	}
	return count;
};

Game2048.prototype.largestValue = function () {
	var largestValue = 0;
	for (var i = 0; i < this.size; i++) {
		for (var j = 0; j < this.size; j++) {
			if (this.board[i][j] && this.board[i][j].value > largestValue) {
				largestValue = this.board[i][j].value
			}
		}
	}
	return largestValue;
};

Game2048.prototype.hasWon = function () {
	return (this.largestValue() >= this.winValue);
};

Game2048.prototype.hasLost = function () {
	return (this.countFreeSpaces() === 0 && !this.hasWon());
};

Game2048.prototype.printBoard = function () {
	//eg:
	// |   2|   2|   2|    |
	// |   2|   4|   2|    |
	// |   8|   4|   8|    |
	// | 256|  64|  32|   2|

	for (var i = 0; i < this.size; i++) {
		var line = '|';
		for (var j = 0; j < this.size; j++) {
			var curVal = '    ';
			var cur = this.board[i][j];
			if (cur) {
				var valueStr = cur.value.toString();
				if (valueStr.length > 4) {
					curVal = '~' + valueStr.substring(0, 3);
				} else {
					curVal = curVal.substring(valueStr.length) + valueStr;
				}
			}
			line += curVal + '|';
		}
		console.log(line);
	}
};

// Basic Solvers

Game2048.prototype.solvers = {
	random: function (hidePrint) { // Max: 512, About than 3 in 10k
		return basicSolver(function () {
			return shuffle(['left', 'right', 'up', 'down']);
		}, hidePrint);
	},
	circular: function (hidePrint) { // Max: 1024, Less than 1 in 100k
		return basicSolver(function () {
			return ['left', 'up', 'right', 'down'];
		}, hidePrint);
	},
	avoidUp: function (hidePrint) { // Max: 1024, Less than 1 in 10k
		return basicSolver(function () {
			return ['down', 'left', 'right', 'up'];
		}, hidePrint);
	},
	leftCorner: function (hidePrint, game) { // Max: 1024, Around than 1 in 10k
		var counter = 0;
		return basicSolver(function () {
			if (counter % 2 === 0) {
				return ['down', 'left', 'right', 'up'];
			} else {
				return ['left', 'down', 'right', 'up'];
			}
		}, hidePrint, game);
	},
	simpleScore: function (hidePrint) {
			// Max: 1024, Around than 0.5 in 1k (emptySpace: 50, merge: 30)
			// Max: 1024, Around than 1.3 in 1k (emptySpace: 10, merge: 20)
			// Max: 1024, Around than 1.6 in 1k (emptySpace: 10, merge: 100)
		return basicSolver(function (game) {
			var points = {
				emptySpace: 10,
				merge: 100
			};
			var direction = {
				left: game.scoreLeft(points),
				right: game.scoreRight(points),
				up: game.scoreUp(points),
				down: game.scoreDown(points)
			};
			return Object.keys(direction).sort(function (a, b) {
				return direction[b] - direction[a]; // Highest score first
			});
		}, hidePrint);
	},
	weightedSolver: function (hidePrint, weightings) {
		return basicSolver(function (game) {
			var direction = {
				left: game.scoreLeft(weightings.points),
				right: game.scoreRight(weightings.points),
				up: game.scoreUp(weightings.points),
				down: game.scoreDown(weightings.points)
			};
			return Object.keys(direction).sort(function (a, b) {
				return direction[b] - direction[a]; // Highest score first
			});
		}, hidePrint);
	}
};

Game2048.prototype.runSolver = function (iterations, solver, verbose) {
	var scores = {};
	var maxScore = 0;

	for (var i = 0; i < iterations; i++) {
		if (verbose) console.log('Running game ' + i);
		else if (i % 1000 === 0) console.log('Running game ' + i);
		var game = solver(!verbose);
		var score = game.largestValue();
		if (score > maxScore) {
			maxScore = score;
		}
		if (scores[score]) {
			scores[score] = scores[score] + 1;
		} else {
			scores[score] = 1;
		}
	}
	console.log('Results - Total Games: ' + iterations + ' Max Score: ' + maxScore);
	console.log('Score Breakdown: ' + JSON.stringify(scores));
};

function basicSolver(getDirections, hidePrint, game) {
	if (!game) {
		game = new Game2048(4);
		game.start();
	}
	var foundSolution = true;
	while (foundSolution) {
		var directions = getDirections(game);
		var success = directions.some(function (direction) {
			return game.move(direction);
		});
		if (!success) {
			foundSolution = false;
		}
	}
	if (!hidePrint){
		game.printBoard();
		console.log('Max value of ' + game.largestValue() + ' in ' + game.currentTurn + ' turns');
	}
	return game;
}

// Genetic Solver

Game2048.prototype.runGeneticSolver = function (maxGenerations, iterations, solver, verbose) {
	var bestWeightings = {
		points: {
			emptySpace: 0, // Based on previous results
			merge: 180 // Based on previous results
		},
		iterations: iterations
	};
	for (var g = 0; g < maxGenerations; g++) {
		console.log('Starting generation ' + g);
		var combinations = constructCombinations(bestWeightings, 5);
		for (var c = 0; c < combinations.length; c++) {
			var weightings = combinations[c];
			weightings.score = this.runWeightedSolver(weightings);
		}
		// Select best combination
		bestWeightings = findBestCombination(combinations);
		console.log('Results: ' + JSON.stringify(bestWeightings));
		// TODO Consider other exit conditions ??
	}
	console.log('Finished!');
};

Game2048.prototype.runWeightedSolver = function (weightings) {
	var scoreSum = 0;

	for (var i = 0; i < weightings.iterations; i++) {
		var game = this.solvers.weightedSolver(true, weightings);
		//var score = game.largestValue();
		var score = game.score;
		scoreSum += score;
	}

	return scoreSum / weightings.iterations;
};

function constructCombinations(bestWeightings, changeAmount) {
	var combinations = [];
	var pointTypes = Object.keys(bestWeightings.points).length;
	combinations.push(makeCombination(bestWeightings, 0, 0));
	for (var i = 0; i < pointTypes; i++) {
		combinations.push(makeCombination(bestWeightings, i, changeAmount));
		combinations.push(makeCombination(bestWeightings, i, -changeAmount));
	}
	return combinations;
}

function makeCombination(bestWeightings, pointToChange, changeBy) {
	var weightings = {
		points: {
			emptySpace: bestWeightings.points.emptySpace,
			merge: bestWeightings.points.merge
		},
		iterations: bestWeightings.iterations
	};
	var i = 0;
	for (var pointName in weightings.points) {
		if (i === pointToChange) {
			weightings.points[pointName] += changeBy;
		}
		i++;
	}
	return weightings;
}

function findBestCombination(combinations) {
	return combinations.sort(function (a, b) {
		return b.score - a.score;
	})[0];
}

// Helper functions

function cleanArray (actual) {
	var newArray = [];
	for(var i = 0; i < actual.length; i++){
		if (actual[i]) {
			newArray.push(actual[i]);
		}
	}
	return newArray;
}

function countNullSpaces(arr) {
	// e.g.: ["a", null, "b", null, null] = 1
	// e.g.: ["a", null, "b", null, "c"] = 2
	// e.g.: [null, null, "b", null, "c"] = 3
	// e.g.: ["a", null, null, null] = 0

	var foundNulls = 0;
	var nullCount = 0;
	for (var p = 0; p < arr.length; p++) {
		if (arr[p]) {
			foundNulls += nullCount;
			nullCount = 0;
		} else {
			nullCount++;
		}
	}
	return foundNulls;
}

function generateColumn(arrOfArrays, colIndex) {
	// Selects a column from an array of arrays
	var col = [];
	for (var i = 0; i < arrOfArrays.length; i++) {
		col.push(arrOfArrays[i][colIndex]);
	}
	return col;
}

function shuffle (o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

window.Game2048 = Game2048;
