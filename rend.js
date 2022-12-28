class GRenderer {
	constructor (canvas,disableimageSmoothing) {
		if (canvas) {
			this.ctx = canvas.getContext("2d");
			this.canvas = canvas;
			if (disableimageSmoothing) {
				this.imageSmoothingEnabled = false;
			} else {
				this.imageSmoothingEnabled = true;
			}
			this.offsetDrawX = 0;
			this.offsetDrawY = 0;
			this.scaleX = 1;
			this.scaleY = 1;
			this.gameScreenWidth = 600;
			this.gameScreenHeight = 360;
			this.blackScreen = false;
			this.mousePos = [0,0];
			this.clickDetectorSprites = [];
			var obj = this;
			this.canvas.onmousemove = function (e) {
				function getMousePos(canvas, evt) {
					var rect = canvas.getBoundingClientRect();
					return {
						x: ((evt.clientX - rect.left) / (rect.right - rect.left) * obj.gameScreenWidth)/2,
						y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * obj.gameScreenHeight
					};
				}
				var pos = getMousePos(obj.canvas, e);// get adjusted coordinates as above
				var x = Math.round(pos.x/1)-(obj.gameScreenWidth/2)/2;
				var y = Math.round(pos.y*-1)+(obj.gameScreenHeight/2);
				//console.log(x,y);
				event.preventDefault();
				obj.mousePos[0] = x*2;
				obj.mousePos[1] = y*-1;
			};
			this.events = {
				mousedown:[],
				mouseup:[]
			};
			document.onmousedown = function () {
				var spriteDetectorClicked = false
				for (var spr of obj.clickDetectorSprites) {
					var sprTouching = obj.checkSpriteCollision(spr,{
						x:obj.mousePos[0],
						y:obj.mousePos[1],
						width:2,
						height:2,
						scale:1
					});
					if (sprTouching) {
						spriteDetectorClicked = true;
						spr.events.click.forEach((f) => {f(obj.mousePos[0],obj.mousePos[1]);});
					}
				}
				if (!(spriteDetectorClicked)) {
					obj.events.mousedown.forEach((f) => {f(obj.mousePos[0],obj.mousePos[1]);});
				}
			};
			document.onmouseup = function () {
				obj.events.mouseup.forEach((f) => {f(obj.mousePos[0],obj.mousePos[1]);}); 
			};
		} else {
			throw Error("No canvas was specified, please use validly: new GRenderer(canvasElement)");
		}
	}
	addClickDetectorSprite (spr) {
		this.clickDetectorSprites.push(spr);
	}
	addEventListener (evt,funct) {
		this.events[evt].push(funct)
	}
	checkCollisions(x1, y1, w1, h1, x2, y2, w2, h2){//square collision
	}
	checkSpriteCollision(spr1,spr2) {
		function getRealCanvasPos(x,y,width,height,screeninfo) {
			var mainX = x//+(width/2);
			var mainY = y//+(height/2);
			return {
				x:mainX+(screeninfo.width/2),
				y:mainY+(screeninfo.height/2),
				width:width,
				height:height
			};
		}
		function check(rect1,rect2) {
			if (rect1.x < rect2.x + rect2.width &&
   rect1.x + rect1.width > rect2.x &&
   rect1.y < rect2.y + rect2.height &&
   rect1.y + rect1.height > rect2.y) {
    return true;
}
		return false;
		}
		var a = {x:this.xToLeft(spr1.x,spr1.width*spr1.scale),y:this.yToTop(spr1.y,spr1.height*spr1.scale),width:spr1.width*spr1.scale,height:spr1.scale*spr1.height};
		var b = {x:this.xToLeft(spr2.x,spr2.width*spr2.scale),y:this.yToTop(spr2.y,spr2.height*spr2.scale),width:spr2.width*spr2.scale,height:spr2.scale*spr2.height};
		//console.log(a,b);
		//debug
		
		//this.ctx.fillStyle = "red";
		//this.ctx.fillRect(a.x*this.scaleX,a.y*this.scaleY,a.width*this.scaleX,a.height*this.scaleY);
		
		//this.ctx.fillStyle = "cyan";
		//this.ctx.fillRect(b.x*this.scaleX,b.y*this.scaleY,b.width*this.scaleX,b.height*this.scaleY);
		
		return check(a,b);
	}
	xToLeft (x,width) {
		return (x-this.offsetDrawX-this.gameScreenWidth/-2)+(width/-2);
	}
	yToTop (y,height) {
		return (y-this.offsetDrawY-this.gameScreenHeight/-2)+(height/-2);
	}
	mousePosToScratchPos (eventmouse)
	 {
		function getMousePos(canvas, evt) {
			var rect = canvas.getBoundingClientRect();
			return {
				x: ((evt.clientX - rect.left) / (rect.right - rect.left) * renderer.width)/2,
				y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * renderer.height
			};
		}
		
		var pos = getMousePos(this.canvas, eventmouse);// get adjusted coordinates as above
		var x = Math.round(pos.x/1)-(this.gameScreenWidth/2)/2;
		var y = Math.round(pos.y*-1)+(this.gameScreenHeight/2);
		event.preventDefault();
		return ({
			x:x,
			y:y
		});
	}
	doScreenRumble (power,seconds) {
		function atimeout() {
			return new Promise((a) => {
				setTimeout(a,1);
			})
		}
		var t = this;
		(async function () {
			var rumbling = true;
			setTimeout(() => {
				rumbling = false;
			},1000*seconds)
			while (rumbling) {
				await atimeout();
				if (Math.random()*5 > 2) {
					t.offsetDrawX = Math.random()*(-power);
					t.offsetDrawY = Math.random()*(-power);
				} else {
					t.offsetDrawX = Math.random()*(power);
					t.offsetDrawY = Math.random()*(power);
				}
			}
			t.offsetDrawX = 0;
			t.offsetDrawY = 0;
		})()
	}
	drawSprites (sprList) {
		this.ctx.fillStyle = "white";
		this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		this.ctx.imageSmoothingEnabled = this.imageSmoothingEnabled;
		var i = 0;
		
		for (var sprite of sprList) {
			this.ctx.save();
			try{
				if (sprite.positiontype.toLowerCase() == "scratch") {
					this.ctx.translate((sprite.x+this.offsetDrawX+this.gameScreenWidth/2)*this.scaleX,(sprite.y+this.offsetDrawY+this.gameScreenHeight/2)*this.scaleY);
				}
				if (sprite.positiontype.toLowerCase() == "top-left") {
					this.ctx.translate((sprite.x+this.offsetDrawX)*this.scaleX,(sprite.y+this.offsetDrawY)*this.scaleY);
				}
				var offsetx = 0;
				var offsety = 0;
				if (sprite.centerImage) {
					offsetx += sprite.width/-2;
					offsety += sprite.height/-2;  
				}
				var offscreen = false;
				//console.log(i);
				//console.log(offscreen);
				this.ctx.globalAlpha = sprite.trs;
				this.ctx.rotate((sprite.direction-90)*Math.PI/180);
				if (sprite.flipH) {
					this.ctx.scale(-1,1);
				} else {
					this.ctx.scale(1,1);
				}
				if (!(offscreen)) {
					var drawinfo = [offsetx*this.scaleX*sprite.scale,offsety*this.scaleY*sprite.scale,sprite.width*this.scaleX*sprite.scale,sprite.height*this.scaleY*sprite.scale];
					var drawX = drawinfo[0];
					var drawY = drawinfo[1];
					var drawWidth = drawinfo[2];
					var drawHeight = drawinfo[3];
					if (sprite.positiontype == "top-left") {
						drawX = sprite.width*this.scaleX*sprite.scale;
					}
					if (sprite.type=="norm") {
						var scaleH = 1;
						var scaleV = 1;
						if (sprite.flipX) {
							scaleH = -1;
						}
						if (sprite.flipY) {
							scaleV = -1;
						}
						this.ctx.scale(scaleH,scaleV);
						if (sprite.imageLocation) {
							//spritesheet support!!!
							var imageLocation = sprite.imageLocation;
							this.ctx.drawImage(sprite.image,imageLocation.x,imageLocation.y,imageLocation.width,imageLocation.height,drawX,drawY,drawWidth,drawHeight);
						} else {
							this.ctx.drawImage(sprite.image,drawX,drawY,drawWidth,drawHeight);
						}
						this.ctx.scale(1,1);
					}
					if (sprite.type=="square") {
						this.ctx.fillStyle = sprite.color;
						this.ctx.fillRect(drawX,drawY,drawWidth,drawHeight);
					}
					if (sprite.type=="text") {
						ctx.font = sprite.size+"px serif";
						ctx.fillStyle = sprite.color;
						sprite.width = ctx.measureText(sprite.text).width;
						ctx.fillText(sprite.text, drawX, drawY);
					}
				}
			}catch(e){}
			i+=1;
			this.ctx.restore();
		}
		if (this.blackScreen) {
			this.ctx.fillStyle = "black";
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}
	createImage (src,name) {
		return new Promise((resolve,reject) => {
			var image = document.createElement("img");
			image.name = "no_name";
			if (name) {
				image.name = name;
			}
			//console.log(`[GRenderer]: Loading Image ${src}`);
			image.onload = function () {
				//console.log(`[GRenderer]: Loaded Image ${src}`);
				resolve(image);
			};
			image.onerror = function () {
				//console.log(`[GRenderer]: Failed To Load Image ${src}`);
				reject();
			};
			image.src = src;
		});
	}
}
class Sprite {
	constructor (x,y,image,width,height) {
		this.x = 0;
		this.y = 0;
		this.image = document.createElement("img");
		this.image.name = "no_name";
		this.imageLocation = null;
		this.centerImage = true;
		this.width = 32;
		this.height = 32;
		this.direction = 90;
		this.trs = 1;
		this.scale = 1;
		this.flipH = false;
		this.events = {
			click:[]
		};
		if (width) {this.width = width;}
		if (height) {this.height = height;}
		if (image) {this.image = image;}
		if (x) {this.x = x;}
		if (y) {this.y = y;}
		this.type = "norm";
		this.positiontype = "scratch";
	}
	changeXBy (moveX) {
		this.x += moveX;
	}
	changeYBy (moveY) {
		this.y += moveY;
	}
	gridSetX (x,y,gridWidth,gridHeight) {
		this.x = (Math.round(x/gridWidth)*gridWidth);
		this.y = (Math.round(y/gridWidth)*gridHeight);
	}
	addEventListener (evname,funct) {
		this.events[evname].push(funct)
	}
}
class SquareSprite {
	constructor (x,y,image,width,height) {
		this.x = 0;
		this.y = 0;
		this.imageLocation = null;
		this.centerImage = true;
		this.width = 32;
		this.height = 32;
		this.direction = 90;
		this.trs = 1;
		this.scale = 1;
		this.flipH = false;
		if (width) {this.width = width;}
		if (height) {this.height = height;}
		if (image) {this.image = image;}
		if (x) {this.x = x;}
		if (y) {this.y = y;}
		this.type = "square";
		this.hasBorder = false;
		this.borderColor = "black";
		this.color = "black";
		this.positiontype = "scratch";
		this.events = {
			click:[]
		};
	}
	changeXBy (moveX) {
		this.x += moveX;
	}
	changeYBy (moveY) {
		this.y += moveY;
	}
	gridSetX (x,y,gridWidth,gridHeight) {
		this.x = (Math.round(x/gridWidth)*gridWidth);
		this.y = (Math.round(y/gridWidth)*gridHeight);
	}
	addEventListener (evname,funct) {
		this.events[evname].push(funct)
	}
}
class TextSprite {
	constructor (x,y,image,width,height) {
		this.x = 0;
		this.y = 0;
		this.imageLocation = null;
		this.centerImage = true;
		this.width = 32;
		this.height = 32;
		this.direction = 90;
		this.trs = 1;
		this.scale = 1;
		this.flipH = false;
		if (width) {this.width = width;}
		if (height) {this.height = height;}
		if (image) {this.image = image;}
		if (x) {this.x = x;}
		if (y) {this.y = y;}
		this.type = "text";
		this.hasBorder = false;
		this.borderColor = "black";
		this.color = "black";
		this.positiontype = "scratch";
		this.size = 15;
		this.events = {
			click:[]
		};
	}
	changeXBy (moveX) {
		this.x += moveX;
	}
	changeYBy (moveY) {
		this.y += moveY;
	}
	gridSetX (x,y,gridWidth,gridHeight) {
		this.x = (Math.round(x/gridWidth)*gridWidth);
		this.y = (Math.round(y/gridWidth)*gridHeight);
	}
	addEventListener (evname,funct) {
		this.events[evname].push(funct)
	}
}