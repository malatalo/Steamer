const { ipcRenderer, BrowserWindow } = require("electron");
const { dialog } = require("electron").remote;
const fetch = require("node-fetch");
const parseString = require("xml2js").parseString;

const ac = document.getElementById("horsey");
let gamesList = [];
let loading = false;

window.addEventListener("load", () => {
  initHorsey();
  loadSettings();
  setupGamesList();
});

window.addEventListener("focus", () => {
  ac.focus();
});

document.getElementById("quitX").addEventListener("click", () => {
  ipcRenderer.send("quit-click");
});

document.getElementById("closeX").addEventListener("click", () => {
  ipcRenderer.send("close-click");
});

document.getElementById("hotkeySet").addEventListener("click", () => {
  const hotkey = document.getElementById("hotkeyInput").value;
  localStorage.setItem("hotkey", hotkey);
  ipcRenderer.send("hotkey", hotkey);
  document.getElementById("hotkeySpan").innerText = "OK!";
  setTimeout(() => {
    document.getElementById("hotkeySpan").innerText = "SET";
  }, 2000);
});

document.getElementById("steamExeDiv").addEventListener("click", () => {
  const options = {
    title: "Select steam.exe",
    properties: ["openFile"],
    message: "Select steam.exe",
    filters: [{ name: "exe", extensions: ["exe"] }, { name: "all", extensions: ["*"] }]
  };
  const steam = dialog.showOpenDialogSync(null, options)[0];
  document.getElementById("steamExeInput").value = steam;
  localStorage.setItem("steamExe", steam);
});

document.getElementById("cb").addEventListener("click", () => {
  const checked = document.getElementById("cb").checked;
  const displayStyle = checked ? "block" : "none";
  document.getElementById("apikeydiv").style.display = displayStyle;
  localStorage.setItem("checked", checked);
});

const loadSettings = () => {
  if (localStorage.hasOwnProperty("checked")) {
    const checked = localStorage.getItem("checked") == "true";
    document.getElementById("cb").checked = checked;
    if (!checked) document.getElementById("apikeydiv").style.display = "none";
  } else {
    document.getElementById("apikeydiv").style.display = "none";
  }

  if (localStorage.hasOwnProperty("apiKey")) {
    document.getElementById("apiKeyInput").value = localStorage.getItem("apiKey");
  }
  if (localStorage.hasOwnProperty("steamId")) {
    document.getElementById("steamIdInput").value = localStorage.getItem("steamId");
  }
  if (localStorage.hasOwnProperty("steamExe")) {
    document.getElementById("steamExeInput").value = localStorage.getItem("steamExe");
  }
  if (localStorage.hasOwnProperty("hotkey")) {
    const hotkey = localStorage.getItem("hotkey");
    document.getElementById("hotkeyInput").value = hotkey;
    ipcRenderer.send("hotkey", hotkey);
  }
};

const setupGamesList = () => {
  let games = localStorage.getItem("games");
  if (!games) {
    fetchGames();
  } else {
    gamesList = JSON.parse(games);
    initHorsey();
  }
};

const fetchGames = () => {
  const apiKey = localStorage.getItem("apiKey");
  const steamid = localStorage.getItem("steamId");
  const useApi = localStorage.getItem("checked");
  if (useApi) {
    if (!steamid || !apiKey) {
      return;
    }
    fetch(
      "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=" +
        apiKey +
        "&steamid=" +
        steamid +
        "&include_appinfo=true&include_played_free_games=true"
    )
      .then(res => res.json())
      .then(data => {
        const games = data.response.games.map(g => {
          return { value: g.appid, name: g.name };
        });
        localStorage.setItem("games", JSON.stringify(games));
        gamesList = games;
        initHorsey();
      });
  } else {
    if (!steamid) {
      return;
    }
    fetch("https://steamcommunity.com/profiles/" + steamid + "/games?tab=all&xml=1")
      .then(response => response.text())
      .then(data =>
        parseString(data, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(result);
            const games = result.gamesList.games[0].game.map(g => {
              return { value: g.appID[0], name: g.name[0] };
            });
            localStorage.setItem("games", JSON.stringify(games));
            gamesList = games;
            initHorsey();
          }
        })
      );
  }
};
let horseee = null;
const initHorsey = () => {
  if (horseee) horseee.destroy();
  horseee = horsey(ac, {
    source: [
      {
        list: gamesList
      }
    ],
    getText: "name",
    getValue: "value",
    limit: 11,
    noMatches: "no matches",
    highlighter: false,
    predictNextSearch(info) {
      document.getElementById("horsey").value = "";
      ipcRenderer.send("startGame", localStorage.getItem("steamExe") ,info.selection.value);
    }
  });
  if (gamesList.length == 0) {
    document.getElementById("horsey").placeholder = "No games loaded!";
  } else {
    document.getElementById("horsey").placeholder = "Search the library";
  }
  let lg = document.getElementById("loadGames");
  lg.innerHTML = "LOAD GAMES";
  loading = false;
  lg.addEventListener("click", () => {
    if (loading) return;
    loading = true;
    lg.innerHTML = "Loading ...";
    localStorage.setItem("apiKey", document.getElementById("apiKeyInput").value);
    localStorage.setItem("steamId", document.getElementById("steamIdInput").value);
    fetchGames();
  });
};
