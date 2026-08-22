require("dotenv").config();
const express = require("express");
const cors = require("cors");
const webSocket = require("socket.io");

const app = express();
const port = process.env.PORT;

app.use(cors());

app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
