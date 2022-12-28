var rem = require("@electron/remote");
var dialog = rem.dialog;
var currentWindow = rem.getCurrentWindow();
var npath = require("path");
var fs = require("fs");

//positioning stuffs

var renderer = new GRenderer(document.getElementById("canvas"));
window.tickAsync = function () {
	return new Promise((a) => {
		setTimeout(a,1);
	})
};
window.waitAsync = function (secs) {
	return new Promise((a) => {
		setTimeout(a,secs*1000);
	})
};
var otherscale = null;
var cvs = renderer.canvas;
setInterval(() => {
	var scale = window.innerHeight/360;
	if (!(otherscale == scale)) {
		cvs.width = scale*600;
		cvs.height = scale*360;
		cvs.style.width = scale*600+"px";
		cvs.style.height = scale*360+"px";
		cvs.style.marginLeft = scale*600/-2+"px";
		renderer.scaleX = scale;
		renderer.scaleY = scale;
		otherscale = scale;
	}
	//document.body.onclick = function () {document.body.children[0].requestFullscreen();};
},1);
navigator.mediaSession.setActionHandler('play', function() { /* Code excerpted. */ });
navigator.mediaSession.setActionHandler('pause', function() { /* Code excerpted. */ });
navigator.mediaSession.setActionHandler('seekbackward', function() { /* Code excerpted. */ });
navigator.mediaSession.setActionHandler('seekforward', function() { /* Code excerpted. */ });
navigator.mediaSession.setActionHandler('previoustrack', function() { /* Code excerpted. */ });
navigator.mediaSession.setActionHandler('nexttrack', function() { /* Code excerpted. */ });

//the real chart editor
var bpmDialog = document.getElementById("bpmDialog");
var bpmDialogBPM = bpmDialog.children[0].children[0].children[0].children[0];
var currentData = {
	"song": {
		"song": "untitled",
		"notes": [
		]
	}
};
var bgSprite = new SquareSprite(0,0,null,600,360);
bgSprite.color = "#c4c4c2";
function scratchMathMod(mod1,mod2) {
    const n = mod1;
    const modulus = mod2;
    let result = n % modulus;
    // Scratch mod uses floored division instead of truncated division.
    if (result / modulus < 0) result += modulus;
    return result;
}
////x,y,image,width,height
var logo = new Sprite(-170,-140,null,217,68);
var openButton = new Sprite(-170,0,null,77,24);
var noteClicksButton = new Sprite(-170,0,null,77,24);
var saveFileButton = new Sprite(-170,0,null,77,24);
var bpmChangeButton = new Sprite(-170,0,null,77,24);
noteClicksButton.trs = 0.5;
function setButtons(array) {
	var y = -64;
	for (var data of array) {
		data.sprite.y = y;
		renderer.addClickDetectorSprite(data.sprite);
		data.sprite.addEventListener("click",data.onclick)
		y += 24;
	}
}
var chartPath = null;
function openFile() {
	var path = dialog.showOpenDialogSync(currentWindow,{title:"Select chart data folder",properties: ['openDirectory']});
	if (path) {
		var folder = path[0];
		var plainJSON = fs.readFileSync(npath.join(folder,"./data.json"),{encoding:"UTF-8"});
		chartPath = path[0];
		//console.log(plainJSON);
		var fileDataJSON = JSON.parse(plainJSON);
		var songPath = npath.join(folder,"../../songs",fileDataJSON.song.song);
		var properties = JSON.parse(fs.readFileSync(npath.join(chartPath,"./properties.json"),{encoding:"UTF-8"}));
		//console.log(songPath)
		songInst.src = loadUrl(npath.join(songPath,"Inst.ogg"),"audio/ogg");
		songVoices.src = loadUrl(npath.join(songPath,"Voices.ogg"),"audio/ogg");
		currentData = fileDataJSON;
		var properties = JSON.parse(fs.readFileSync(npath.join(chartPath,"./properties.json"),{encoding:"UTF-8"}));
		BPM = properties.songBPM;
	}
}
function changeBPM() {
	bpmDialog.open = true;
	bpmDialogBPM.value = BPM;
	bpmDialog.addEventListener('close', () => {
		BPM = bpmDialogBPM;
	});
}
function saveFile() {
	if (chartPath) {
		fs.writeFileSync(npath.join(chartPath,"data.json"),JSON.stringify(currentData,null,"\t"),{encoding:"UTF-8"});
		var properties = JSON.parse(fs.readFileSync(npath.join(chartPath,"./properties.json"),{encoding:"UTF-8"}));
		properties.songBPM = BPM;
	}
}
window.noteTicks = false;
setButtons([
	{
		sprite:openButton,
		onclick:openFile
	},
	{
		sprite:saveFileButton,
		onclick:saveFile
	},
	{
		sprite:bpmChangeButton,
		onclick: changeBPM
	},
	{
		sprite:noteClicksButton,
		onclick: function () {
			noteTicks = !noteTicks;
			if (noteTicks) {
				noteClicksButton.trs = 1;
			} else {
				noteClicksButton.trs = 0.5;
			}
		}
	}
])
function getUISprites() {
	return [
		openButton,
		logo,
		saveFileButton,
		bpmChangeButton,
		noteClicksButton
	];
}
function loadUrl(src,type) {
	try{
		logConsole("GET "+src);
	}catch(e){}
	return "data:"+type+";charset=utf-8;base64,"+fs.readFileSync(src,{encoding:"Base64"});
}
function loadFile(src,type) {
	try{
		logConsole("GET "+src);
	}catch(e){}
	return fs.readFileSync(src,{encoding:"UTF-8"});
}
function fileExists(src) {
	try{
		logConsole("CHECK "+src);
	}catch(e){}
	return fs.existsSync(src);
}

var songInst = new Audio();
var songVoices = new Audio();
var chartingTick = new Audio("src/ChartingTick.ogg");
var editNote = new Sprite(0,0,null,32,32);
var offcenterDown = false;
window.noteScroll = 0;
window.BPM = 150;
var hitNotes = [];
var lastHitNotes = [];
(async function () {
	window.noteSprites = {};
	window.buttonSprites = {};
	//load note images
	window.noteSprites.bf = await renderer.createImage("./notes/bfnote.png"); //the note gets fliped for other directions
	window.noteSprites.op = await renderer.createImage("./notes/opnote.png"); //the note gets fliped for other directions
	//load button images
	window.buttonSprites.noteclicks = await renderer.createImage("./src/noteclicks.png");
	window.buttonSprites.open = await renderer.createImage("./src/open.png");
	window.buttonSprites.save = await renderer.createImage("./src/save.png");
	window.buttonSprites.bpm = await renderer.createImage("./src/bpm.png");
	//logo
	window.logoImage = await renderer.createImage("./src/logo.png");
	//put sprites
	logo.image = logoImage;
	openButton.image = buttonSprites.open;
	noteClicksButton.image = window.buttonSprites.noteclicks;
	saveFileButton.image = window.buttonSprites.save;
	bpmChangeButton.image = window.buttonSprites.bpm;
})();


function onNoteHit() {
	if (noteTicks) {
		chartingTick.currentTime = 0;
		chartingTick.play();
	}
}
var DrawNotesOffset = -140;
var noteDirections = {
	//op/dad
	4:90,
	1:-90,
	2:180,
	3:0,
	//bf/boyfriend
	8:90,
	5:-90,
	6:180,
	7:0
};
function getNoteSprites() {
	var notes = [];
	//add other notes
	lastHitNotes = hitNotes;
	hitNotes = [];
	for (var note of currentData.song.notes){
		//console.log(notes.holdLength);
		if (note.holdLength > 2) {
			var releaseTime = (0+(((note.holdLength/1000)*BPM)/240));
			var hn = new SquareSprite((((note.note*32)-160)-DrawNotesOffset)-4,(note.time*BPM)+noteScroll,null,8,((releaseTime)*BPM)+29);
			hn.centerImage = false;
			hn.color = "#d6d6d6";
			notes.push(hn);
		}
		var noteDrawSprite = new Sprite(((note.note*32)-160)-DrawNotesOffset,(note.time*BPM)+noteScroll,(note.note > 4) ?  (window.noteSprites.bf) : window.noteSprites.op,32,32);
		noteDrawSprite.direction = (noteDirections)[note.note];
		noteDrawSprite.trs = 1;
		var hittime = 2.666*((60/window.BPM));
		hittime += 5;
		if (noteDrawSprite.y < hittime) {
			if (!(songVoices.paused)) {
				noteDrawSprite.trs = 0.5;
			}
			hitNotes.push(true);
		}
		noteDrawSprite.color = "green";
		if (noteDrawSprite.y < (360/2) && noteDrawSprite.y > (360/-2)) {
			notes.push(noteDrawSprite);
		}
	}
	if (lastHitNotes.length < hitNotes.length) {
		if (!(songVoices.paused)) {
			onNoteHit()
		}
	}
	return notes;
}
function getSectionSprites() {
	var multiplier4 = 60*(150/window.BPM);
	var multiplier3 = 20*(150/window.BPM);
	var multiplier2 = 30*(150/window.BPM);
	var tileSprite1 = new SquareSprite(160/2,0,null,160,360);
	tileSprite1.color = "#05008c";
	tileSprite1.x -= 16;
	tileSprite1.x -= DrawNotesOffset;
	var tileSprite2 = new SquareSprite(160/-2,0,null,160,360);
	tileSprite2.color = "#8c1500";
	tileSprite2.x -= 16;
	tileSprite2.x -= DrawNotesOffset;
	//op
	var tileY = 360;
	var tileOffset = scratchMathMod(window.noteScroll,multiplier4);
	tileY -= tileOffset*-1;
	var extraTiles = [];
	var tileColorTick = false;
	for(var i = 0; i < 50; i++){
		tileY -= multiplier2;
		tileColorTick = !tileColorTick;
		var tileSprite = new SquareSprite(160/-2,tileY,null,160,multiplier2);
		tileSprite.x -= DrawNotesOffset+16;
		if (tileColorTick) {
			tileSprite.color = "#a1a1a1";
		} else {
			tileSprite.color = "#828282";
		}
		extraTiles.push(tileSprite);
	}
	
	//bf
	
	var tileY = 360;
	tileY -= tileOffset*-1;
	var tileColorTick = true;
	for(var i = 0; i < 50; i++){
		tileY -= multiplier2;
		tileColorTick = !tileColorTick;
		var tileSprite = new SquareSprite(160/-2,tileY,null,160,multiplier2);
		tileSprite.x -= DrawNotesOffset+(16*1);
		tileSprite.x += 160;
		if (tileColorTick) {
			tileSprite.color = "#a1a1a1";
		} else {
			tileSprite.color = "#828282";
		}
		extraTiles.push(tileSprite);
	}
	return [tileSprite1,tileSprite2].concat(extraTiles);
}
var editorPos = {
	time:0,
	note:1
};
window.testDraw = true;
setInterval(() => {
	//the editor note sprite (the note that follows your cursor)
	var multiplier2 = 30*(150/window.BPM);
	var enote = ((renderer.mousePos[0]-160)-DrawNotesOffset)+32;
	enote = (Math.round(enote/32));
	if (enote < 1) {
		enote = 1;
	}
	if (enote > 8) {
		enote = 8;
	}
	var editTime = renderer.mousePos[1]*1;
	editTime = editTime-noteScroll;
	if (!(offcenterDown)) {
		editTime = (Math.round(editTime/multiplier2))*multiplier2;
	}
	editTime = (editTime/BPM);
	if (editTime < 0) {
		editTime = 0;
	}
	//console.log(enote);
	editorPos.time = editTime;
	editorPos.note = enote;
	editNote.x = ((enote*32)-160)-DrawNotesOffset;
	editNote.trs = 0.6;
	editNote.direction = (noteDirections)[enote];
	editNote.y = (editTime*BPM)+noteScroll;
	editNote.image = (enote > 4) ?  (window.noteSprites.bf) : window.noteSprites.op;
	
	
	//scroll
	window.noteScroll = (songVoices.currentTime)*-BPM;
	if (songInst.paused) {
		songVoices.pause();
	} else {
		songVoices.play();
	}
	
	//set sprites to draw
	var sprites = [];
	sprites.push(bgSprite);
	sprites = sprites.concat(getSectionSprites());
	sprites = sprites.concat(getNoteSprites());
	var sizeW = 700;
	var noteLine = new SquareSprite((sizeW/2)+DrawNotesOffset,0,null,sizeW,5);
	noteLine.x += 100;
	noteLine.color = "black";
	sprites.push(noteLine);
	sprites.push(editNote);
	//ui sprites
	sprites = sprites.concat(getUISprites());
	
	//Draw Sprites
	if (window.testDraw) {
		renderer.drawSprites(sprites);
	}
},1)

document.onwheel = (function(e) {
	//console.log("scroll");
	if (songInst.paused) {
	  songVoices.currentTime -= e.deltaY/-1000;
	  songInst.currentTime = songVoices.currentTime;
	  if (songVoices.currentTime < 0) {
		  songVoices.currentTime = 0;
	  }
	}
})
var newNote = {
	time: editorPos.time,
	mustHitSection: false,
	custom: '',
	note: editorPos.note,
	holdLength: 0
};
document.onkeydown = (function(e) {
	if (e.key == " ") {// " " = space bar
		if (songInst.paused) {
			songInst.play();
		} else {
			songInst.pause();
		}
	}
	if (e.key == "Shift") {
		offcenterDown = true;
	}
	if (e.key == "q") {
		newNote.holdLength += 100;
	}
	if (e.key == "w") {
		newNote.holdLength -= 100;
	}
})
document.onkeyup = (function (e) {
	if (e.key == "Shift") {
		offcenterDown = false;
	}
})
renderer.addEventListener("mousedown",function (x,y){
	if (x > -160-DrawNotesOffset) {
		var deleteNote = null;
		for (var note of currentData.song.notes) {
			if ((Math.round(note.time*10)/10 == Math.round(editorPos.time*10)/10) && (editorPos.note == note.note)) {
				deleteNote = note;
			}
		}
		if (deleteNote) {
			var newNotes = [];
			for (var note of currentData.song.notes) {
				if (!((Math.round(note.time*10)/10 == Math.round(editorPos.time*10)/10) && (editorPos.note == note.note))) {
					newNotes.push(note);
				}
			}
			currentData.song.notes = newNotes;
		} else {
			newNote = {
				time: editorPos.time,
				mustHitSection: false,
				custom: '',
				note: editorPos.note,
				holdLength: 0
			};
			currentData.song.notes.push(newNote);
			currentData.song.notes.sort((a,b) => a.time-b.time)
		}
	}
})