import express from "express";
import Sound from "../models/Sound.js";

const router = express.Router();

router.get("/", function (req, res, next) {
    res.send("Got a response from the sound route");
  });
  
  export default router;