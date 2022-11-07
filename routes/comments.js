import express from "express";
import Comment from "../models/Comment.js";

const router = express.Router();

router.get("/", function (req, res, next) {
    res.send("Got a response from the comment route");
  });
  
  export default router;