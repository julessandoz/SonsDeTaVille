import express, { json } from "express";
import {authenticate} from "./auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User

const router = express.Router();

// GET LIST OF ALL USERS
router.get("/", authenticate, function (req, res, next) {
  User.find().sort('username').exec(function (err, users) {
    if (err) {
      return next(err);
    }
    res.send(users)
  });
});

// FIND USER BY ID
router.get("/:username", authenticate, function (req, res, next) {
  User.findOne({username: req.params.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    res.send(user);
  });
});



// CREATE NEW USER
router.post("/", function (req, res, next) {
  const user = new User({username: req.body.username, email: req.body.email, clearPassword: req.body.password});
  user.save(function (err, savedUser) {
    if (err) {
      return next(err);
    }
    res.status(201).send(savedUser);
  });
});

router.patch("/:username", authenticate, function (req, res, next) {
  User.findOne({username: req.params.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.currentUserRole === "admin" || req.currentUserId === user._id) {
      user.username = req.body.username;
      user.email = req.body.email;
      user.clearPassword = req.body.password;
      user.save(function (err, savedUser) {
        if (err) {
          return next(err);
        }
        res.send(savedUser);
      });
    } else {
      res.sendStatus(401);
    }
  });
});

export default router;
