var canvas = $('checkers');
var width = canvas.width;
var height = canvas.height;
var scaleX = canvas.scrollWidth / width;
var scaleY = canvas.scrollHeight / height;
//canvas.scrollHeight = width+60;
var context = canvas.getContext('2d');
window.addEventListener('resize', function() {
	// canvas resize, etc.
	scaleX = canvas.scrollWidth / width;
	scaleY = canvas.scrollHeight / height;
}, false);

class Checker {
	constructor(id = "999") {
	    this.id = id;
	    this.Y0 = 40;
		this.xsize = Math.floor(width / 8);
		this.ysize = this.xsize;
		this.boardx = this.xsize * 8;
		this.boardy = this.ysize * 8;
		this.reverse = false;
	}
	Restart() {
		var x;
		this.board = new Array(8);
		for(x = 0; x < 8; x++) {
			this.board[x] = new Array(8);
		}
		this.num_cyan_pieces = 12;
		this.num_black_pieces = 12;
		// Initialize pieces
		// 0 = nothing, 1=p1, -1=p2
		for(x = 0; x < 8; x++) {
			for(var y = 0; y < 8; y++) {
				this.board[x][y] = 0;
			}
		}
		for(x = 0; x < 8; x += 2) {
			this.board[x][0] = 1;
			this.board[x + 1][1] = 1;
			this.board[x][2] = 1;
			this.board[x + 1][5] = -1;
			this.board[x][6] = -1;
			this.board[x + 1][7] = -1;
		}
		this.player = 1;
		this.current_move = new Array(); // e.g. [[1,1],[3,3],[5,1]] = 2 jumps from 1,1
		this.moveHistory = [];
		this.DrawBoard();
		$('history').innerHTML = "";
	}
	screenPix(x, y) {
		if(this.reverse) {
			x = 7 - x;
		} else {
			y = 7 - y;
		}
		var x_pix = x * this.xsize;
		var y_pix = y * this.ysize;
		return [x_pix, y_pix];
	}
	reverseBoard() {
		this.reverse = !this.reverse;
		this.DrawBoard();
	}
	DrawPieces() {
		context.strokeStyle = "black";
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				var checker = this.G(x, y);
				if(checker != 0) {
					if(checker % 3 == 0) checker /= 3;
					context.fillStyle = (checker > 0) ? "cyan" : "black";
					context.strokeStyle = "lightgray";
					var [x_pix, y_pix] = this.screenPix(x, y);
					if(Math.abs(checker) == 1) {
						context.beginPath();
						//context.moveTo(x_pix + this.xsize / 2, y_pix + this.Y0 + 8);
						context.arc(x_pix + this.xsize / 2, y_pix + this.Y0 + this.ysize / 2, 12, 0, Math.PI * 2, false);
						context.fill();
						context.stroke();
					} else { 
						context.beginPath();
						//context.moveTo(x_pix + this.xsize / 2, y_pix + 12 + this.Y0);
						context.arc(x_pix + this.xsize / 2 - 4, y_pix + this.ysize / 2 + 4 + this.Y0, 12, 0, Math.PI * 2, false);
						context.fill();
						context.stroke();
						context.beginPath();
						//context.moveTo(x_pix + this.xsize / 2, y_pix + 4 + this.Y0);
						context.arc(x_pix + this.xsize / 2 + 4, y_pix + this.ysize / 2 - 4 + this.Y0, 12, 0, Math.PI * 2, false);
						context.fill();
						context.stroke();
					}
				}
			}
		}
	}
	DrawMovePath() {
		var i;
		context.save();
		context.fillStyle = "rgba(255, 80, 80, 0.2)";
		for(i = 0; i < this.current_move.length; ++i) {
			var [x_pix, y_pix] = this.screenPix(this.current_move[i][0], this.current_move[i][1]);
			context.fillRect(x_pix, y_pix + this.Y0, this.xsize, this.ysize);
		}
		if(this.current_move.length > 1) {
			context.fillStyle = "Green";
			roundedRect(context, (this.boardx - 100) / 2, 10, 100, 20, 6, true);
			context.fillStyle = "yellow";
			context.font = "14pt sans-serif";
			context.fillText("✔️ Confirm", (this.boardx - 100) / 2 + 3, 27);
			for(i = 1; i < this.current_move.length; ++i) {
				// Draw move direction
				var [x_pix_start, y_pix_start] = this.screenPix(this.current_move[i - 1][0], this.current_move[i - 1][1]);
				var [x_pix_end, y_pix_end] = this.screenPix(this.current_move[i][0], this.current_move[i][1]);
				var x_dir = ((x_pix_end - x_pix_start) > 0) ? -10 : 10;
				var y_dir = ((y_pix_end - y_pix_start) > 0) ? -10 : 10;
				context.strokeStyle = "rgba(125, 0, 0, 0.5)";
				context.lineWidth = 4;
				context.setLineDash([15, 5]);
				context.fillStyle = "rgba(0, 0, 0, 0.5)";
				context.beginPath();
				context.moveTo(x_pix_start + this.xsize / 2, y_pix_start + this.ysize / 2 + this.Y0);
				context.lineTo(x_pix_end + this.xsize / 2 + (x_dir / 2), y_pix_end + this.ysize / 2 + (y_dir / 2) + this.Y0);
				context.stroke();
				
				context.beginPath();
				context.fillStyle = "red";
				context.arc(x_pix_end + this.xsize / 2 + (x_dir / 2), y_pix_end + this.ysize / 2 + (y_dir / 2) + this.Y0,
				    6, 0, Math.PI * 2, false);
				context.fill();
			}
		}
		context.restore();
	}
	DrawClickInfo() {
		context.font = "10pt sans-serif";
		context.fillStyle = (this.player == 1) ? "cyan" : "black";
		context.fillText((this.player == 1) ? "Cyan to Move" : "Black to Move", this.boardx - 100, 20);
		// Game ID
		context.strokeStyle = "black"
		roundedRect(context, 10, 10, 110, 20, 5, false);
		context.fillStyle = "black"
		context.fillText("Game ID:"+this.id, 15, 25);
		if(this.current_move.length > 0) {
			this.DrawMovePath();
		}
	}
	CleanBoard() {
		// Unmarks previously marked pieces
		for(var x = 0; x < 8; ++x) {
			for(var y = 0; y < 8; ++y) {
				if(this.G(x, y) % 3 == 0) this.S(x, y, this.G(x, y) / 3);
			}
		}
	}
	DrawBoard() {
		context.fillStyle = "rgb(255,255,255)";
		context.clearRect(0, 0, this.boardx, this.boardy + 60);
		context.fillRect(0, 0, this.boardx, this.boardy + 60);
		context.fillStyle = "rgb(240,240,240)";
		for(var y = 0; y < this.boardy; y += this.ysize) {
			for(var x = 0; x < this.boardx; x += this.xsize) {
			
				if(((x / this.xsize + y / this.ysize) % 2 !== 0)) {
					context.fillRect(x, y + this.Y0, this.xsize, this.ysize);
				}
			}
		}
		this.DrawPieces();
		this.DrawClickInfo();
	}
	showHistory() {
		var html = "";
		var his = JSON.parse(JSON.stringify(this.moveHistory));
		var his = his.reverse();
		his.forEach((move) => {
			var pl = move.player;
			html += pl == 1 ? "Cyan" : "Black" + ":";
			for(var i = 0; i < move.move.length; ++i) {
				var p = move.move[i];
				html += " " + p[0] + "," + p[1] + " ";
			}
			html += "<br/>";
		});
		$('history').innerHTML = html;
		//$('history').innerText = JSON.stringify(moveHistory, null, 4);
	}
	replay(delay = 1000) {
		var his = JSON.parse(JSON.stringify(this.moveHistory));
		this.Restart();
		var j = 0;
		his.forEach((move, j) => {
			
			setTimeout(() => {
			    var pl = move.player;
			    this.player = pl;
				for(var i = 0; i < move.move.length; ++i) {
					var p = move.move[i];
					this.checkPoint(p[0], p[1]);
				}
				this.MakeTheMove();
				if(delay > 100) this.DrawBoard();
			}, j * delay); // one sec interval
		});
		if(delay <= 100) this.DrawBoard();
	}
	MakeTheMove() {
	    //alert('ok');
	    
		this.moveHistory[this.moveHistory.length] = {
			move: this.current_move,
			player: this.player
		};
		for(var i = 0; i < this.current_move.length - 1; ++i) {
			var start = this.current_move[i];
			var end = this.current_move[i + 1];
			if(Math.abs(start[0] - end[0]) == 2 && this.G(start[0], start[1]) == this.player) { // capture
				var mid_x = (start[0] + end[0]) / 2;
				var mid_y = (start[1] + end[1]) / 2;
				this.S(mid_x, mid_y, 0);
				if(this.player == 1) this.num_black_pieces--;
				else this.num_cyan_pieces--;
			};
			if(Math.abs(start[0] - end[0]) >= 2 && this.G(start[0], start[1]) == 2*this.player) { // capture
			    var dirx = -(start[0] - end[0])/Math.abs(start[0] - end[0]);
				var diry = -(start[1] - end[1])/Math.abs(start[1] - end[1]);
				var jumped_x = start[0]+dirx;
				var jumped_y = start[1]+diry;
				var found=false;
				var foundx, foundy;
				while(jumped_x != end[0]){
			
				    if (this.G(jumped_x, jumped_y) == -3*this.player){
				        found = true;
				        foundx = jumped_x;
				        foundy = jumped_y;
				    }
				    jumped_x = jumped_x+dirx;
				    jumped_y = jumped_y+diry;
				}
				if (found){
				    this.S(foundx, foundy, 0);
				    if(this.player == 1) this.num_black_pieces--;
				    else this.num_cyan_pieces--;
				}
			}
			this.S(end[0], end[1], this.G(start[0], start[1]));
			this.S(start[0], start[1], 0);
		}
		
		// Promotion
		if(end[1] == ((this.player == 1) ? 7 : 0)) {
			if(Math.abs(this.G(end[0], end[1])) == 1) {
				this.S(end[0], end[1], this.G(end[0], end[1]) * 2);
			}
		}
		if(this.num_cyan_pieces == 0 || this.num_black_pieces == 0) {
			alert("Game Over!");
		}
		this.current_move = new Array();
		this.CleanBoard();
		this.player = -this.player;
		this.showHistory();
	}
	checkPoint(x, y) {
		var move_length = this.current_move.length;
		//alert(board[x][y]+":"+x+","+y+"->"+move_length);
		if(move_length == 0) {
			// Check First Move for Valid Selection
			if(this.G(x, y) == this.player || this.G(x, y) == this.player * 2) {
				this.current_move.push(new Array(x, y));
				//alert(1);
				return;
			}
		} else {
			// Does move follow from the previous one?
			var startplayer = this.G(this.current_move[0][0], this.current_move[0][1]);
			var old_x = this.current_move[move_length - 1][0];
			var old_y = this.current_move[move_length - 1][1];
			if(x == old_x && y == old_y) { 
			    //toggle the last move selection
				this.current_move.pop();
				if(move_length > 1 && Math.abs(old_x - this.current_move[move_length - 2][0]) == 2) {
					// Clean jumped piece
					var xx = (this.current_move[move_length - 2][0] + old_x) / 2;
					var yy = (this.current_move[move_length - 2][1] + old_y) / 2;
					this.S(xx, yy, this.G(xx, yy) / 3);
				}
				//alert(2);
				return;
			}
			if(x == this.current_move[0][0] && y == this.current_move[0][1] && (move_length < 4 || move_length % 2 != 0)) {
				// Cyclic move not allowed.
				this.current_move = new Array();
				this.CleanBoard();
				//alert(3);
				return;
			}
			if(move_length > 1 && Math.abs(this.current_move[move_length - 2][0] - old_x) == 1) {
				//alert(4);
				return; // Last move not a capture, can't continue the move
			}
			// Check diagonal move
			if(Math.abs(old_x - x) != Math.abs(old_y - y)) {
				//alert(5);
				return; // Not a diagonal move, clearly not possible
			}
			if(this.G(x, y) != 0 && (x != this.current_move[0][0] || y != this.current_move[0][1])) {
				//alert(6);
				return; // There's a piece in the way, this isn't the moving piece
			}
			if(Math.abs(old_x - x) == 2 && startplayer == this.player) {
			    // Take over move
				//alert(7);
				//alert(this.G(old_x, old_y)+"-"+x+","+y);
				var jumped_x = (x + old_x) / 2;
				var jumped_y = (y + old_y) / 2;
				if(this.G(jumped_x, jumped_y) != -this.player && this.G(jumped_x, jumped_y) != -this.player * 2) {
					//alert(71);
					return; // Not jumping an enemy piece
				} else {
					//alert(72);
					this.S(jumped_x, jumped_y, this.G(jumped_x, jumped_y) * 3); // Mark as will-be-jumped
				}
			}
			if(Math.abs(old_x - x) >= 2 && startplayer === 2*this.player) {
			    
				var dirx = -(old_x - x)/Math.abs(old_x - x);
				var diry = -(old_y - y)/Math.abs(old_y - y);
				var jumped_x = old_x+dirx;
				var jumped_y = old_y+diry;
				var found=false;
				var foundx, foundy;
				while(jumped_x != x){
				    if (this.G(jumped_x, jumped_y) == -this.player && found) return;
				    if (this.G(jumped_x, jumped_y) == this.player) return;
				    if (this.G(jumped_x, jumped_y) == -this.player){
				        found = true;
				        foundx = jumped_x;
				        foundy = jumped_y;
				    }
				    jumped_x = jumped_x+dirx;
				    jumped_y = jumped_y+diry;
				}
				if (found)
				this.S(foundx, foundy, this.G(foundx, foundy) * 3); // Mark as will-be-jumped
			}
			if(Math.abs(this.G(this.current_move[0][0], this.current_move[0][1])) == 1 && ((y - old_y) > 0) != (this.player > 0)) {
				//alert(8);
				return; // Non-promoted piece going the wrong way.
			}
			// Seems to check out!
			this.current_move.push(new Array(x, y));
			return;
		}
	}
	G(x, y) {
		return this.reverse ? this.board[x][y] : this.board[x][y];
	}
	S(x, y, v) {
		if(this.reverse) this.board[x][y] = v;
		else this.board[x][y] = v;
	}
	OnClick(e) {
		var x_pix = (e.pageX - canvas.offsetLeft) / scaleX;
		var y_pix = (e.pageY - canvas.offsetTop) / scaleY;
		//alert(this.boardx + " " + x_pix+" "+y_pix);
		if(y_pix > this.Y0 && y_pix < this.boardy + this.Y0) {
			if(this.num_black_pieces == 0 || this.num_cyan_pieces == 0) {
				// game is over
				return;
			}
			// If on active board, is it a valid move specification?
			var x = Math.floor(x_pix / this.xsize);
			var y = Math.floor((y_pix - this.Y0)/ this.ysize);
			//alert(x+" "+y+" "+ysize);
			if(this.reverse) {
				x = 7 - x;
			} else {
				y = 7 - y;
			}
			this.checkPoint(x, y);
			this.DrawBoard();
		} else {
			// If not on the board, did they click an active button?
			if(this.current_move.length > 1 && x_pix > (this.boardx - 100) / 2 && x_pix <= (this.boardx + 100) / 2 && y_pix > 10 && y_pix <= 30) {
				this.MakeTheMove();
				this.DrawBoard();
			} 
		}
	}
}

function $(id) {
	return document.getElementById(id);
}

var checker = new Checker();
if($('checkers').addEventListener) {
	$('checkers').addEventListener('click', function(e) {
		checker.OnClick(e);
	}, false);
}
checker.Restart();
