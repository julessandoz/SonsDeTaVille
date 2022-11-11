import express, { json } from "express";
import {authenticate} from "./auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User

const router = express.Router();



// GET LIST OF ALL USERS

/**
 * @api {get} /users Get a list of all users
 * @apiName GetUsers
 * @apiGroup Users
 * @apiSuccess {Object[]} users List of users
 * @apiSuccess {String} users._id User id
 * @apiSuccess {String} users.username User username
 * @apiSuccess {String} users.email User email
 * @apiSuccess {Boolean} users.admin User admin
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * [
 * {
 * "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "username": "Mario",
 * "email": "
 * "admin": false,
 * "__v": 0
 * }
 * ]
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
 * @apiParam {String} username User username
 * @apiSuccess {String} _id User id
 * @apiSuccess {String} username User username
 * @apiSuccess {String} email User email
 * @apiSuccess {Boolean} admin User admin
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "username": "Mario",
 * "email": "
 * "admin": false,
 * "__v": 0
 * }
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
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * {
 * "username": "Mario",
 * "password": "1234",
 * "email": "
 * }
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
 * @apiParam {String} username Username of the user
 * 
 * @apiSuccess {String} informations Informations reçues
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "username": "Mario",
 * "password": "1234",
 * "email": "
 * }
 */

router.patch("/:username", authenticate, function (req, res, next) {
  User.findOne({username: req.params.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.currentUserRole === "admin" || req.currentUserId === user._id) {
      req.body.username? res.status(401).send("Username cannot be modified"): null;
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

// DELETE A USER
router.delete("/:username", authenticate, function (req, res, next) {
  User.findOne({username: req.params.username}, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.currentUserRole === "admin" || req.currentUserId === user._id) {
      User.findOneAndDelete({username: req.params.username}, function (err, user) {
        if (err) {
          return next(err);
        }
        res.status(204).send("User deleted successfully!");
      });
    } else {
      res.sendStatus(401);
    }
  });
});

export default router;
