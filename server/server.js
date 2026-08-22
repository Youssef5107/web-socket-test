require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
);

// 1. Wrap Express in Node's HTTP server
const server = http.createServer(app);

// 2. Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Success!" });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
