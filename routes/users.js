import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Got a response from the users route");
});

export default router;
