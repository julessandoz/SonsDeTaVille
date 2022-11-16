import express, { json } from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User;
const Sound = mongoose.models.Sound;
const Comment = mongoose.models.Comment;

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
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * [
 * {
 * "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "username": "Mario",
 * "email": "mario@tendo.jp"
 * "__v": 0
 * }
 * ]
 */

router.get("/", authenticate, function (req, res, next) {
  User.find()
    .sort("username")
    .exec(function (err, users) {
      if (err) {
        return next(err);
      }
      res.send(users);
    });
});

// FIND USER BY USERNAME

/**
 * @api {get} /users/:username Find a user by username
 * @apiGroup Users
 * @apiName FindUser
 * @apiParam {String {required}} username User username
 * @apiSuccess {String} _id User id
 * @apiSuccess {String} username User username
 * @apiSuccess {Number} sounds total of sounds posted
 * @apiSuccess {Number} comments total of comments posted
 * @apiSuccess {String} email User email
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "_id": "637202823dff67cbfc51a424",
 * "username": "audreycks",
 * "soundsPosted": 0,
 * "commentsPosted": 0,
 * "email": "audrey.csikos@heig-vd.ch"
 * }
 * 
 */

router.get("/:username", authenticate, function (req, res, next) {
  User.findOne({ username: req.params.username }, function (err, user) {
    if (err) {
      return next(err);
    }
    let soundCount;
    let commentCount;
    Sound.aggregate(
      [
        { $match: { user: user._id } },
        {
          $group: {
            _id: "$user",
            count: { $sum: 1 },
          },
        },
      ],
      function (err, result) {
        if (err) {
          return next(err);
        }
        soundCount = result[0] ? result[0].count : 0;
        Comment.aggregate(
          [
            { $match: { author: user._id } },
            {
              $group: {
                _id: "$author",
                count: { $sum: 1 },
              },
            },
          ],
          function (err, result) {
            if (err) {
              return next(err);
            }
            commentCount = result[0] ? result[0].count : 0;

            user.soundsPosted = soundCount;
            user.commentsPosted = commentCount;
            res.send({
              _id: user._id,
              username: user.username,
              soundsPosted: user.soundsPosted,
              commentsPosted: user.commentsPosted,
              email: user.email,
            });
          }
        );
      }
    );
  });
});

// CREATE NEW USER

/**
 * @api {post} /users Create a new user
 * @apiGroup Users
 * @apiName CreateUser
 * @apiBody {String{2..20}} username User username
 * @apiBody {String} email User email
 * @apiBody {String} password User password
 * @apiParamExample {json} Request-Example:
 * {
 * "username": "Bowser",
 * "email": "king@tendo.jp",
 * "password": "123456",
 * }
 * @apiSuccess {String} username User username
 * @apiSuccess {String} email User email
 * @apiSuccess {Number} __v User version
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * {
 * "username": "Bowser",
 * "email": "king@tendo.jp",
 * "password": "123456",
 * "__v": 0
 * }
 */

router.post("/", function (req, res, next) {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    clearPassword: req.body.password,
  });
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
 * @apiGroup Users
 * @apiName ModifyUser
 * @apiParam {String} username Username of the user
 * @apiBody {String} username User username
 * @apiBody {String} password User password
 * @apiBody {String} email User email
 * @apiSuccess {String} username User username
 * @apiSuccess {String} email User email
 * @apiSuccess {String} email User email
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "username": "Mario",
 * "password": "123456",
 * "email": "mario@tendo.jp"
 * }
 * @apiErrorExample {json} Error 404
 * HTTP/1.1 404 Not Found
 * {
 * "message": "User not found"
 * }
 *
 * @apiErrorExample {json} Error 401
 * HTTP/1.1 401 Unauthorized
 * {
 * "message": "Username cannot be modified"
 * }
 */

router.patch("/:username", authenticate, function (req, res, next) {
  User.findOne({ username: req.params.username }, function (err, user) {
    if (err || !user) {
      if (!user) {
        err = new Error("User not found");
        err.status = 404;
      }
      return next(err);
    }
    if (req.currentUserRole === "admin" || req.currentUserId == user._id) {
      req.body.username
        ? res.status(401).send("Username cannot be modified")
        : null;
      user.email = req.body.email ? req.body.email : user.email;
      user.clearPassword = req.body.password
        ? req.body.password
        : user.clearPassword;
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
/**
 * @api {delete} /users/:username Delete a user
 * @apiGroup Users
 * @apiName DeleteUser
 * @apiParam {String} username Username of the user
 * @apiSuccess {String} message User deleted
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "message": "User deleted successfully"
 * }
 * @apiErrorExample {json} Error
 * HTTP/1.1 401 Unauthorized
 * {
 * "message": "Unauthorized"
 * }
 * @apiErrorExample {json} Error 404
 * HTTP/1.1 404 Not Found
 * {
 * "message": "User not found"
 * }
 */

router.delete("/:username", authenticate, function (req, res, next) {
  User.findOne({ username: req.params.username }, function (err, user) {
    if (err || !user) {
      if (!user) {
        err = new Error("User not found");
        err.status = 404;
      }
      return next(err);
    }
    if (req.currentUserRole === "admin" || req.currentUserId == user._id) {
      User.findOneAndDelete(
        { username: req.params.username },
        function (err, user) {
          if (err) {
            return next(err);
          }
          res.status(200).send("User deleted successfully!");
        }
      );
    } else {
      res.sendStatus(401);
    }
  });
});

export function getUserFromId(id) {
  return User.findById(id);
}

export default router;
