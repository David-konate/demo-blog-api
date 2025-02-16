const express = require("express");
const app = express();
const articleRoutes = require("./routes/articleRoutes");
const connectDB = require("./mongoConfig");
require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello, API avec Yarn!");
});

app.use("/api", articleRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
