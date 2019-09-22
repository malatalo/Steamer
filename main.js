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
    handleHide();
  });

  win.on("close", function(event) {
    if (!application.isQuiting) {
      event.preventDefault();
      handleHide();
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
  handleHide();
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
  handleHide();
});

ipcMain.on("quit-click", (evt, arg) => {
  app.quit();
});

let visible = false;
ipcMain.on("hotkey", (evt, arg) => {
  globalShortcut.unregisterAll();
  globalShortcut.register(arg, () => {
    if(visible){
      handleHide();
    } else {
      win.show();
    }
  });
});

ipcMain.on("startGame", (evt, exe, game) => {
  handleHide();
  let bat = spawn("cmd.exe", [
    "/c",
    exe,
    "steam://run/"+game
  ]);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

const handleHide = () => {
  win.webContents.send("hideYoKids");
  win.hide();
}

// #YOLO
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
