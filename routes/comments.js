import express from "express";
import Comment from "../models/Comment.js";

const router = express.Router();

//create apidoc comments
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
 *   HTTP/1.1 200 OK
 *  [
 *   {
 *   "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 *  "text": "This is a comment",
 * "author": "Mario",
 * "post": "Juego de Mario",
 * "createdAt": "2020-10-08T20:00:00.000Z",
 * "updatedAt": "2020-10-08T20:00:00.000Z",
 * "__v": 0
 * }
 * ]
 */
 
router.get("/", function (req, res, next) {
    res.send("Got a response from the comment route");
  });
  
  export default router;