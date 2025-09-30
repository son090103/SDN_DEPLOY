const express = require("express");
const ClientRouter = express.Router();
const Controller = require("../controller/Client.controller");
ClientRouter.post("/booking", Controller.createBooking);
ClientRouter.delete("/booking/:bookingId", Controller.deleteBooking);
ClientRouter.get("/booking", Controller.getAllBooking);
ClientRouter.get("/bookingsByDate", Controller.getBookingsByDate);
module.exports = ClientRouter;
