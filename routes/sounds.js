import express from "express";
import Sound from "../models/Sound.js";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";

const User = mongoose.models.User;
const Category = mongoose.models.Category;

const router = express.Router();
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET ALL SOUNDS
/**
 * @api {get} /sounds Get all sounds
 * @apiName GetSounds
 * @apiGroup Sounds
 * @apiVersion 1.0.0
 * @apiDescription Get all sounds
 * @apiSuccess {Object[]} sounds List of sounds
 * @apiSuccess {String} sounds._id Sound id
 * @apiSuccess {String} sounds.user User id
 * @apiSuccess {Object} sounds.location Location
 * @apiSuccess {String} sounds.location.type Location type
 * @apiSuccess {Number[]} sounds.location.coordinates Location coordinates
 * @apiSuccess {String} sounds.category Category id
 * @apiSuccess {String[]} sounds.comments Comments ids
 * @apiSuccess {Date} sounds.date Date
 * @apiSuccess {String} sounds.sound Sound
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * [
 *  {
 *    "_id": "5e9b7b0b0b9b9b0b0b9b9b0b",
 *    "user": "5e9b7b0b0b9b9b0b0b9b9b0b",
 *    "location": {
 *      "type": "Point",
 *      "coordinates": [0,0]
 *    },
 *    "category": "5e9b7b0b0b9b9b0b0b9b9b0b",
 *    "comments": [
 *      "5e9b7b0b0b9b9b0b0b9b9b0b"
 *    ],
 *    "date": "2020-04-20T15:00:00.000Z",
 *    "sound": "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAESsAABYAAAC"
 *  }
 * ]
 */

// GET LIST OF SOUNDS THAT MATCH THE QUERY PARAMETERS
router.get("/", authenticate, function (req, res, next) {
  let limit = 10;
  let offset = 0;
  let query = {};
  if (req.query.location) {
    const location = JSON.parse(req.query.location);
    const maxRadius = 50000;
    const minRadius = 500;
    location.radius = location.radius ? location.radius : maxRadius;
    let radiusInMeters = location.radius * 1000;
    radiusInMeters = radiusInMeters > maxRadius ? maxRadius : radiusInMeters;
    radiusInMeters = radiusInMeters < minRadius ? minRadius : radiusInMeters;
    let radiusInDegrees = radiusInMeters / 111300;
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
        $maxDistance: radiusInDegrees,
      },
    };
  }
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.username) {
    User.find({ username: req.query.username }).then((user) => {
      query.user = user[0]._id;
    });
  }
  if (req.query.date) {
    // transform date to date object
    const date = new Date(req.query.date);
    query.date = { $gte: date };
  }
  if (req.query.limit) {
    const maxLimit = 100;
    const minLimit = 1;
    limit = req.query.limit;
    limit = limit > maxLimit ? maxLimit : limit;
    limit = limit < minLimit ? minLimit : limit;
  }

  if (req.query.offset) {
    const totalSounds = Sound.countDocuments(query);
    const maxOffset = totalSounds - limit;
    const minOffset = 0;
    offset = req.query.offset;
    offset = offset > maxOffset ? maxOffset : offset;
    offset = offset < minOffset ? minOffset : offset;
  }
  Sound.find(query)
    .limit(limit)
    .sort({ date: -1 })
    .populate("user")
    .exec(function (err, sounds) {
      if (err) {
        return next(err);
      }
      res.send(sounds);
    });
});

// CREATE A NEW SOUND
/**
 * @api {post} /sounds Create a new sound
 * @apiName CreateSound
 * @apiGroup Sounds
 * @apiBody {String} category Category of the sound
 * @apiBody {String} location Location of the sound
 * @apiBody {File} file File of the sound
 * @apiSuccess {String} Message Sound successfully created
 * @apiSuccessExample {text} Saved sound
 * HTTP/1.1 201 Created
 * 
 * Sound successfully created
 */
router.post(
  "/",
  upload.single("uploaded_audio"),
  authenticate,
  function (req, res, next) {
    const location = JSON.parse(req.body.location);
    const { lat, lng } = location;
    Category.findOne({ name: req.body.category }, function (err, cat) {
      if (err || !cat) {
        if (!cat) {
          err = new Error("Category not found");
          err.status = 404;
        }
        return next(err);
      }
      const sound = new Sound({
        location: {
          type: "Point",
          coordinates: [lat, lng],
        },
        category: cat._id,
        user: req.currentUserId,
        date: new Date(),
        sound: req.file.buffer,
      });
      sound.save(function (err, savedSound) {
        if (err) {
          return next(err);
        }
        res.status(201).send("Sound saved successfully");
      });
    });
  }
);

// GET A SOUND BY ID
/**
 * @api {get} /sounds/:id Get a sound by id
 * @apiName GetSoundById
 * @apiGroup Sounds
 * @apiParam {String} id Sound id
 * @apiSuccess {String} title Title of the sound
 * @apiSuccess {String} description Description of the sound
 * @apiSuccess {String} category Category of the sound
 * @apiSuccess {String} location Location of the sound
 * @apiSuccess {String} file File of the sound
 * @apiSuccess {String} user User of the sound
 * @apiSuccess {String} date Date of the sound
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 *  {
 *    "category": "Sound category",
 *    "location": "Sound location",
 *    "file": "Sound file",
 *    "user": "Sound user",
 *    "date": "Sound date"
 *  }
 * @apiErrorExample {text} Sound not found
 * HTTP/1.1 404 Not Found
 *  
 * Sound not found
 * */
router.get("/:id", authenticate, function (req, res, next) {
  Sound.findById(req.params.id)
    .populate("user")
    .exec(function (err, sound) {
      if (err || !sound) {
        if (!sound) {
          err = new Error("Sound not found");
          err.status = 404;
        }
        return next(err);
      }
      res.send(sound);
    });
});

// GET SOUND DATA BY ID
router.get("/data/:id", authenticate, function (req, res, next) {
  Sound.findById(req.params.id, function (err, sound) {
    if (err || !sound) {
      if (!sound) {
        err = new Error("Sound not found");
        err.status = 404;
      }
      return next(err);
    }
    res.send(sound.sound);
  });
});

// UPDATE A SOUND'S CATEGORY BY ID
/**
 * @api {patch} /sounds/:id Update a sound's category by id
 * @apiName UpdateSoundCategoryById
 * @apiGroup Sounds
 * @apiParam {String} id Sound id
 * @apiBody {String} category Category of the sound
 * @apiSuccess {String} title Title of the sound
 * @apiSuccess {String} description Description of the sound
 * @apiSuccess {String} category Category of the sound
 * @apiSuccess {String} location Location of the sound
 * @apiSuccess {String} file File of the sound
 * @apiSuccess {String} user User of the sound
 * @apiSuccess {String} date Date of the sound
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 *  {
 *    "title": "Sound title",
 *    "description": "Sound description",
 *    "category": "Sound category",
 *    "location": "Sound location",
 *    "file": "Sound file",
 *    "user": "Sound user",
 *    "date": "Sound date"
 *  }
 * @apiErrorExample {json} Sound not found
 * HTTP/1.1 404 Not Found
 *  {
 *    "error": "SoundNotFound"
 *  }
 */
router.patch("/:id", authenticate, function (req, res, next) {
  Sound.findById(req.params.id, function (err, sound) {
    if (err || !sound) {
      if (!sound) {
        err = new Error("Sound not found");
        err.status = 404;
      }
      return next(err);
    }
    if (sound.user != req.currentUserId || req.currentUserRole != "admin") {
      return res
        .status(401)
        .send("You are not authorized to update this sound");
    }
    sound.category = req.body.category;
    sound.save(function (err, savedSound) {
      if (err) {
        return next(err);
      }
      res.send(savedSound);
    });
  });
});

// DELETE A SOUND BY ID
/**
 * @api {delete} /sounds/:id Delete a sound by id
 * @apiName DeleteSoundById
 * @apiGroup Sounds
 * @apiParam {String} id Sound id
 * @apiSuccessExample {json} Success
 * HTTP/1.1 204 Deleted
 * {
 *    "messafe": "Sound deleted successfully"
 *  }
 * @apiErrorExample {json} Sound not found
 * HTTP/1.1 404 Not Found
 * {
 * "error": "Sound Not Found"
 * }
 * @apiErrorExample {json} Unauthorized
 * HTTP/1.1 401 Unauthorized
 * {
 * "error": "You are not authorized to delete this sound"
 * }
 */
router.delete("/:id", authenticate, function (req, res, next) {
  const soundToDelete = Sound.findById(req.params.id);
  if (
    soundToDelete.user === req.currentUserId ||
    req.currentUserRole === "admin"
  ) {
    Sound.findByIdAndDelete(req.params.id, function (err, sound) {
      if (err || !sound) {
        if (!sound) {
          err = new Error("Sound not found");
          err.status = 404;
        }
        return next(err);
      }
      res.status(204).send("Sound deleted successfully!");
    });
  } else {
    res.status(401).send("You are not authorized to delete this sound");
  }
});

export default router;
