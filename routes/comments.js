import express from "express";
import Comment from "../models/Comment.js";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User;

const router = express.Router();

// GET LIST OF ALL COMMENTS THAT MATCH THE QUERY PARAMETERS
router.get("/", authenticate, function (req, res, next) {
  let query = {};
  let offset = 0;
  let limit = 10;
  const maxLimit = 100;
  const minLimit = 1;

  if (req.query.sound) {
    query.sound = req.query.sound;
  }
  if (req.query.user) {
    query.author = req.query.user;
  }
  if (req.query.offset) {
    offset = req.query.offset;
  }
  if (req.query.limit) {
    limit = req.query.limit;
    limit = limit > maxLimit ? maxLimit : limit;
    limit = limit < minLimit ? minLimit : limit;
  }

  Comment.find(query)
    .skip(offset)
    .limit(limit)
    .sort({ date: -1 })
    .populate("author")
    .exec(function (err, comments) {
      if (err) {
        return next(err);
      }
      res.send(comments);
    }
  );
});

// CREATE A NEW COMMENT
router.post("/", authenticate,  function (req, res, next) {
  const authorUsename = req.body.author;
  const author = User.find({ username: authorUsename });
  const comment = new Comment({
    sound: req.body.sound,
    author: author._id,
    comment: req.body.comment
  });
  comment.save(function (err, comment) {
    if (err) {
      return next(err);
    }
    res.send(comment);
  });
});

// UPDATE A COMMENT
router.patch("/:id", authenticate, function (req, res, next) {
  const commentToEdit = Comment.findById(req.params.id);
  const author = User.find({ username: commentToEdit.author });
  if (author._id === req.currentUserId || req.currentUserRole === "admin") {
    Comment.findByIdAndUpdate(req.params.id, req.body, function (err, comment) {
      if (err) {
        return next(err);
      }
      res.send(comment);
    });
  } else {
    res.status(401).send("You are not authorized to edit this comment");
  }
});

// DELETE A COMMENT
router.delete("/:id", authenticate, function (req, res, next) {
  const commentToDelete = Comment.findById(req.params.id);
  if (commentToDelete.author === req.currentUserId || req.currentUserRole === "admin") {
    Comment.findByIdAndDelete(req.params.id, function (err, comment) {
      if (err) {
        return next(err);
      }
      res.send("Comment deleted");
    });
  } else {
    res.status(401).send("You are not authorized to delete this comment");
  }
});

  
  export default router;