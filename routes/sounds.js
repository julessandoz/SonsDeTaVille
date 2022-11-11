import express from "express";
import Sound from "../models/Sound.js";
import {authenticate} from "./auth.js";

const router = express.Router();

// GET ALL SOUNDS

/**
 * @api {get} /sounds Get all sounds
 * @apiName GetSounds
 * @apiGroup Sounds
 * @apiSuccess {Object[]} sounds List of sounds
 * @apiSuccess {Schema.Types.ObjectId} user User id
 * @apiSuccess {
 *    @apiSuccess {String} title Sound title
 *    @apiSuccess {
 *        @apiSuccess 
 *  
 */
router.get("/", function (req, res, next) {
  const { lat, lng, radius } = req.query.location;
  const category = req.query.category;
  const username = req.query.username;
  const date = req.query.date;
  const limit = req.query.limit;
  // get sounds with the quey parameters that are not null
  Sound.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radius,
      },
    },
    category: category,
    user: username,
    date: date,
  })
    .limit(limit)
    .then((sounds) => {
      res.json(sounds);
    })
    .catch(next);
});


  export default router;