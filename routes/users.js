import express, { json } from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import * as config from "../config.js";
const User = mongoose.models.User;
const Sound = mongoose.models.Sound;
const Comment = mongoose.models.Comment;

const router = express.Router();

/**
 * @api {options} /users Get allowed methods
 * @apiName OptionsUsers
 * @apiGroup Users
 * @apiDescription Get allowed methods
 * @apiSuccessExample {text} Success-Response:
 * HTTP/1.1 204 No Content
 * Allow: GET, POST, PATCH, DELETE, OPTIONS
 * 
 */
router.options("/", function (req, res, next) {
  res.set("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
  res.status(204).send();
});

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
    if (err || !user) {
      if (!user) {
        err = new Error("User not found");
        err.status = 404;
      }
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
              role: user.admin? "admin" : "user",
            });
          }
        );
      }
    );
  });
});

/**
 * @api {post} /users Create a new user
 * @apiGroup Users
 * @apiName CreateUser
 * @apiBody {String{2..20}} username User username
 * @apiBody {String} email User email
 * @apiBody {String{8+}} password User password
 * @apiParamExample {json} Request-Example:
 * {
 * "username": "Bowser",
 * "email": "king@tendo.jp",
 * "password": "123456",
 * }
 * @apiSuccess {String} Message User successfully created
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 201 Created
 * 
 * {
 * "message": "User successfully created",
 * "email": king@tendo.jp,
 * "username": Bowser
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
    res.status(201).send({
      message: "User successfully created",
      email: savedUser.email,
      username: savedUser.username
    });
  });
});

/**
 * @api {patch} /users/:username Modify a user
 * @apiGroup Users
 * @apiName ModifyUser
 * @apiParam {String} username Username of the user to modify
 * @apiBody {String} password User password
 * @apiBody {String} email User email
 * @apiSuccess {String} Message User successfully modified
 * @apiSuccessExample {text} Success
 * HTTP/1.1 200 OK
 * 
 * User successfully modified
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
 * @apiErrorExample {json} Error 401
 * HTTP/1.1 401 Unauthorized
 * {
 * "message": "Password is required"
 * }
 */

router.patch("/:username", authenticate, async (req, res) => {
  try {
    const username = req.params.username;
    const update = {};
    if (req.body.username) {
      return res.status(401).send({ message: "Username cannot be modified" });
    }
    if (req.body.email) update.email = req.body.email;
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(401).send("Password must be at least 8 characters long");
      }
      const hashedPassword = await bcrypt.hash(req.body.password, config.bcryptFactor);
      update.password = hashedPassword;
    }

    if (req.currentUserRole === "admin" || req.currentUserId == await User.findOne({ username: username })._id) {
      const user = await User.findOneAndUpdate(
        { username: username },
        update,
        { new: true }
      );
      res.send(user); 
    } else {
      return res.status(401).send("You are not authorized to modify this user");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});

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
        async function (err, user) {
          if (err) {
            return next(err);
          }
          // find all comments on sounds posted by this user and delete them
          const soundsPosted = await Sound.find({ user: user._id});
          const commentsOnSoundsPosted = await Comment.find({ sound: { $in: soundsPosted } });
          await Comment.deleteMany({ _id: { $in: commentsOnSoundsPosted } });

          Sound.deleteMany({ user: user._id }, function (err) {
            if (err) {
              return next(err);
            }
          });
          Comment.deleteMany({ author: user._id }, function (err) {
            if (err) {
              return next(err);
            }
          });

          res.status(200).send("User deleted successfully!");
        }
      );
    } else {
      res.sendStatus(401);
    }
  });
});

export default router;
