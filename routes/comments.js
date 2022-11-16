import express from "express";
import Comment from "../models/Comment.js";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import { sendMessageToUser } from "../ws.js";
const User = mongoose.models.User;
const Sound = mongoose.models.Sound;

const router = express.Router();

/**
 * @api {get} /comments Get all comments
 * @apiName GetComments
 * @apiGroup Comments
 * @apiSuccess {Object[]} comments List of comments
 * @apiSuccess {String} comments._id Comment id
 * @apiSuccess {String} comments.text Comment text
 * @apiSuccess {String} comments.author Comment author
 * @apiSuccess {String} comments.post Comment post
 * @apiSuccess {Date} comments.createdAt Comment creation date
 * @apiSuccess {Date} comments.updatedAt Comment update date
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * [
 * {
 * "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "text": "This is a comment",
 * "author": "Mario",
 * "post": "Juego de Mario",
 * "createdAt": "2020-10-08T20:00:00.000Z",
 * "updatedAt": "2020-10-08T20:00:00.000Z",
 * "__v": 0
 * }
 * ]
 */

// GET LIST OF ALL COMMENTS THAT MATCH THE QUERY PARAMETERS
router.get("/", authenticate, function (req, res, next) {
  let query = {};
  let offset = 0;
  let limit = 10;
  const maxLimit = 100;
  const minLimit = 1;
  let maxOffset = Comment.countDocuments();
  const minOffset = 0;

  if (req.query.sound) {
    Sound.findById(req.query.sound, function (err, sound) {
      if (err || !sound) {
        if (!sound) {
          err = new Error("Sound not found");
          err.status = 404;
        }
        return next(err);
      }
      query.sound = req.query.sound;
    });
  }
  if (req.query.user) {
    query.author = req.query.user;
  }
  if (req.query.limit) {
    limit = req.query.limit;
    limit = limit > maxLimit ? maxLimit : limit;
    limit = limit < minLimit ? minLimit : limit;
    maxOffset -= limit;
  }
  if (req.query.offset) {
    maxOffset = Comment.countDocuments(query) - limit;
    offset = req.query.offset;
    offset = offset > maxOffset ? maxOffset : offset;
    offset = offset < minOffset ? minOffset : offset;
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
    });
});

// CREATE A NEW COMMENT
/**
 * @api {post} https://sons-de-ta-ville.onrender.com/comments Create a new comment
 * @apiGroup Comments
 * @apiName CreateComment
 * @apiBody {String} sound  sound id
 * @apiBody {String} comment Comment text
 * @apiSampleRequest https://sons-de-ta-ville.onrender.com/comments
 * @apiSuccess {String} message Comment created
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * {
 * "message": "Comment created"
 * }
 */

router.post("/", authenticate, function (req, res, next) {
  const author = req.currentUserId;
    const comment = new Comment({
      sound: req.body.sound,
      author: author,
      comment: req.body.comment
    });
    
    Sound.findById(req.body.sound, function (err, sound) {
      if (err || !sound) {
        if (!sound) {
          err = new Error("Sound not found");
          err.status = 404;
        }
        return next(err);
      }
    comment.save(function (err, comment) {
      if (err) {
        console.log(err);
        return next(err);
      }
      User.findById(sound.user, function (err, user) {
        if (err || !user) {
          if (!user) {
            err = new Error("User not found");
            err.status = 404;
          }
          return next(err);
        }
        sendMessageToUser("New comment", user._id, "newNotification");
      });
      res.status(201).send("Comment created");
    });
  });
});


// UPDATE A COMMENT
/**
 * @api {patch} /comments/:idComment Modify a comment
 * @apiGroup Comments
 * @apiName ModifyComment
 * @apiParam {String} idComment id of the comment
 * @apiSuccess {String} message Comment updated
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "message": "Comment updated"
 * }
 * @apiError CommentNotFound The id of the comment was not found.
 * @apiErrorExample {json} Error
 * HTTP/1.1 404 Not Found
 * {
 * "error": "CommentNotFound"
 * }
 * @apiErrorExample {json} Error
 * HTTP/1.1 401 Unauthorized
 * {
 * "error": "Unauthorized"
 * }
 */

router.patch("/:id", authenticate, function (req, res, next) {
  const commentToEdit = Comment.findById(req.params.id);
  const author = User.find({ username: commentToEdit.author });
  if (author._id === req.currentUserId || req.currentUserRole === "admin") {
    Comment.findByIdAndUpdate(req.params.id, req.body, function (err, comment) {
      if (err || !comment) {
        if (!comment) {
          err = new Error("Comment not found");
          err.status = 404;
        }
        return next(err);
      }
      res.send("Comment updated");
    });
  } else {
    res.status(401).send("You are not authorized to edit this comment");
  }
});

// DELETE A COMMENT
/**
 * @api {delete} /comments/:idComment Delete a comment
 * @apiGroup Comments
 * @apiName DeleteComment
 * @apiParam {String} idComment id of the comment
 * @apiSuccess {String} message Comment deleted
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "message": "Comment deleted"
 * }
 * @apiError (401) Unauthorized You are not authorized to delete this comment
 * @apiErrorExample {json} Unauthorized
 * HTTP/1.1 401 Unauthorized
 * {
 * "error": "You are not authorized to delete this comment"
 * }
 * @apiError (404) CommentNotFound Comment not found
 * @apiErrorExample {json} CommentNotFound
 * HTTP/1.1 404 CommentNotFound
 * {
 * "error": "Comment not found"
 * }
 *
 */
router.delete("/:id", authenticate, function (req, res, next) {
  const commentToDelete = Comment.findById(req.params.id);
  if (
    commentToDelete.author === req.currentUserId ||
    req.currentUserRole === "admin"
  ) {
    Comment.findByIdAndDelete(req.params.id, function (err, comment) {
      if (err || !comment) {
        if (!comment) {
          err = new Error("Comment not found");
          err.status = 404;
        }
        return next(err);
      }
      res.send("Comment deleted");
    });
  } else {
    res.status(401).send("You are not authorized to delete this comment");
  }
});

export default router;
