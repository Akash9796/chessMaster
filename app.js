const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const { Chess } = require("chess.js");
const dotenv = require("dotenv");

const app = express();
const server = http.createServer(app);
dotenv.config({
  path: "./data/config.env",
});

const io = socket(server);
const chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "GandMaster" });
});

io.on("connection", function (uniqueSocket) {
  console.log("New Client connected");
  uniqueSocket.on("clientEvent", () => {
    uniqueSocket.emit("paapdi");
  });

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }

  uniqueSocket.on("disconnect", () => {
    if (uniqueSocket.id === players.white) {
      delete players.white;
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
    }
    console.log("Client disconnected");
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move :", move);
        uniqueSocket.emit("invalidmove", move);
      }
    } catch (error) {
      console.log(error);
      uniqueSocket.emit("invalidmove", move);
    }
  });
});

server.listen(process.env.PORT || 4000);
