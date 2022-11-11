import express, { json } from "express";
import {authenticate} from "./auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User

const router = express.Router();

// GET LIST OF ALL USERS
/**
 * @api {get} /users Get a list of all users
 * @apiGroup User
 * @apiName GetUsers
 * 
 * @apiSuccess {String} informations Informations reçues
 */

router.get("/", authenticate, function (req, res, next) {
  console.log(User);
  User.find().sort('username').exec(function (err, users) {
    if (err) {
      return next(err);
    }
    res.send(users)
  });
});

// FIND USER BY USERNAME
/**
 * @api {get} /users/:username Find a user by username(email)
 * @apiGroup User
 * @apiName FindUser 
 * 
 * @apiSuccess {String} informations Informations reçues
 */
router.get("/:username", authenticate, function (req, res, next) {
  User.findOne({username: req.params.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    res.send(user);
  });
});



// CREATE NEW USER
/**
 * @api {post} /users Create a new user
 * @apiGroup User
 * @apiName CreateUser
 * 
 * @apiSuccess {String} informations Informations reçues
 */
router.post("/", function (req, res, next) {
  const user = new User({username: req.body.username, email: req.body.email, clearPassword: req.body.password});
  user.save(function (err, savedUser) {
    if (err) {
      return next(err);
    }
    res.status(201).send(savedUser);
  });
});


// MODIFY A USER 
/**
 * @api {patch} /users/:username Modify a user
 * @apiGroup User
 * @apiName ModifyUser
 * 
 * @apiSuccess {String} informations Informations reçues
 */
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
