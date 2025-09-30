const express = require("express");
const app = express();
const port = 3000;
const database = require("./src/config/database");
const routerClient = require("./src/routers/index.routes");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routerClient(app);
database.connect();
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
