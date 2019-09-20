const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage } = require("electron");
const spawn = require("child_process").spawn;
const path = require("path");
const iconpath = path.join(__dirname, 'steamer2.png');

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 540,
    frame: false,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: iconpath
  });
  win.loadFile("index.html");
  // win.webContents.openDevTools();
  win.on("closed", () => {
    win = null;
  });

  win.on("minimize", function(event) {
    event.preventDefault();
    win.hide();
  });

  win.on("close", function(event) {
    if (!application.isQuiting) {
      event.preventDefault();
      win.hide();
    }

    return false;
  });

  var appIcon = new Tray(nativeImage.createFromPath(iconpath));
  var contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Steamer",
      click: function() {
        win.show();
        appIcon.setContextMenu(contextMenu);
      }
    },
    {
      label: "Quti",
      click: function() {
        app.isQuiting = true;
        app.quit();
        appIcon.setContextMenu(contextMenu);
      }
    }
  ]);

  appIcon.setContextMenu(contextMenu);
}

app.on("ready", () => {
  createWindow();
  win.on("hide", () => {visible = false});
  win.on("show", () => {visible = true});
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});

const { ipcMain } = require("electron");
ipcMain.on("close-click", (evt, arg) => {
  win.hide();
});

ipcMain.on("quit-click", (evt, arg) => {
  app.quit();
});

let visible = true;
ipcMain.on("hotkey", (evt, arg) => {
  globalShortcut.unregisterAll();
  globalShortcut.register(arg, () => {
    if(visible){
      win.hide();
    } else {
      win.show();
    }
  });
});

ipcMain.on("startGame", (evt, exe, game) => {
  win.hide();
  let bat = spawn("cmd.exe", [
    "/c",
    exe,
    "steam://run/"+game
  ]);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// #YOLO
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
