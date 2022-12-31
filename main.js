require('@electron/remote/main').initialize()
var {app,dialog,BrowserWindow,Menu} = require("electron");

Menu.setApplicationMenu(Menu.buildFromTemplate([]));

function createWindow() {
	let win = new BrowserWindow({
		width: 351*2, 
		height: 210*2,
		transparent:true,
		frame: false,
		icon:"./icon.png"
	})
	win.show();
	win.setAlwaysOnTop(true, 'screen');
	win.loadFile("startuplogo/index.html");
	setTimeout(() => {
		win.close();
		let win2 = new BrowserWindow({
			width: 1000, 
			height: 500,
			icon:"./icon.png",
			title:"Friday Night Gvbvdxxin' Chart Editor",
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			}
		});
		//win2.openDevTools();
		win2.show();
		win2.loadFile("index.html");
		require('@electron/remote/main').enable(win2.webContents)
	},4000);
}

app.on("ready",createWindow);