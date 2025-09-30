const routers = require("./client.routes");
module.exports = (app) => {
  app.use("/", routers);
};
