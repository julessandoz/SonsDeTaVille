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

/**
 * @api {options} /sounds Get allowed methods
 * @apiName OptionsSounds
 * @apiGroup Sounds
 * @apiDescription Get allowed methods
 * @apiSuccessExample {text} Success-Response:
 * HTTP/1.1 204 No Content
 * Allow: GET, POST, PATCH, DELETE, OPTIONS
 */
router.options("/", authenticate, function (req, res, next) {
  res.set("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
  res.status(204).send();
});

/**
 * @api {get} /sounds Get all sounds
 * @apiName GetSounds
 * @apiGroup Sounds
 * @apiDescription Get all sounds
 * @apiParam {Object} [location] Location object ({"lat": 46.78123, "lng": 6.64731, "radius": 1000}) radius is in meters and optional
 * @apiParam {String} [category] Category id
 * @apiParam {String} [user] Username
 * @apiParam {Date} [date] Date (sounds posted since this date) (ISO 8601)
 * @apiParam {Number} [limit] Limit the number of results
 * @apiParam {Number} [offset] Skip the first n results
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
 *  }
 * ]
 */
router.get("/", authenticate, function (req, res, next) {
  let limit = 10;
  let offset = 0;
  let query = {};
  if (req.query.date) {
    if (!req.query.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
      return res.status(400).send("Invalid date");
    }
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
    offset = req.query.offset;
  }
  if (req.query.location) {
    let location = JSON.parse(req.query.location);
    const maxRadius = 50000;
    const minRadius = 500;
    location.radius = location.radius ? location.radius : maxRadius;
    location.radius = location.radius > maxRadius ? maxRadius : location.radius;
    location.radius = location.radius < minRadius ? minRadius : location.radius;
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
        $maxDistance: location.radius,
      },
    };
  }

  if (req.query.category) {
    Category.findById(req.query.category, function (err, category) {
      if (err || !category) {
        if (!category) {
          err = new Error("Category not found");
          err.status = 404;
        }
        return next(err);
      }
      query.category = category._id;

      if (req.query.username) {
        User.findOne({ username: req.query.username }, function (err, user) {
          if (err || !user) {
            if (!user) {
              err = new Error("User not found");
              err.status = 404;
            }
            return next(err);
          }
          query.user = user._id;
          Sound.find(query)
            .limit(limit)
            .skip(offset)
            .sort({ date: -1 })
            .populate("user")
            .populate("category")
            .populate("comments")
            .exec(function (err, sounds) {
              if (err) {
                return next(err);
              }
              res.send(sounds);
            });
        });
      } else {
        Sound.find(query)
          .limit(limit)
          .skip(offset)
          .sort({ date: -1 })
          .populate("user")
          .populate("category")
          .populate("comments")
          .exec(function (err, sounds) {
            if (err) {
              return next(err);
            }
            res.send(sounds);
          });
      }
    });
  } else {
    if (req.query.username) {
      User.findOne({ username: req.query.username }, function (err, user) {
        if (err || !user) {
          if (!user) {
            err = new Error("User not found");
            err.status = 404;
          }
          return next(err);
        }
        query.user = user._id;
        Sound.find(query)
          .limit(limit)
          .skip(offset)
          .sort({ date: -1 })
          .populate("user")
          .populate("category")
          .populate("comments")
          .exec(function (err, sounds) {
            if (err) {
              return next(err);
            }
            res.send(sounds);
          });
      });
    } else {
      Sound.find(query)
        .limit(limit)
        .skip(offset)
        .sort({ date: -1 })
        .populate("user")
        .populate("category")
        .populate("comments")
        .exec(function (err, sounds) {
          if (err) {
            return next(err);
          }
          res.send(sounds);
        });
    }
  }
});

/**
 * @api {post} /sounds Create a new sound
 * @apiName CreateSound
 * @apiGroup Sounds
 * @apiBody {String} category Category of the sound
 * @apiBody {String} location Location of the sound Format: {"lat": 0, "lng": 0}
 * @apiBody {File} uploaded_audio File of the sound
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
      console.log(req.file);
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

/**
 * @api {get} /sounds/data/:id Get sound data by id
 * @apiName GetSoundDataById
 * @apiGroup Sounds
 * @apiParam {String} id Sound id
 * @apiSuccess {Buffer} sound Sound data
 * @apiSuccessExample {Buffer} Success
 * HTTP/1.1 200 OK
 *
 * Octet stream
 */
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

/**
 * @api {patch} /sounds/:id Update a sound's category by id
 * @apiName UpdateSoundCategoryById
 * @apiGroup Sounds
 * @apiParam {String} id Sound id
 * @apiBody {String} category Name of new category
 * @apiSuccess Message Sound successfully updated
 * @apiSuccessExample {text} Success
 * HTTP/1.1 200 OK
 *  {
 *    Sound updated successfully
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
    User.findById(sound.user, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user._id == req.currentUserId || req.currentUserRole === "admin") {
        Category.findOne({ name: req.body.category }, function (err, cat) {
          if (err || !cat) {
            if (!cat) {
              err = new Error("Category not found");
              err.status = 404;
            }
            return next(err);
          }
          sound.save(function (err, savedSound) {
            if (err) {
              return next(err);
            }
            res.send("Sound updated successfully");
          });
        });
      } else {
        return res
          .status(401)
          .send("You are not authorized to update this sound");
      }
    });
  });
});

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
  const soundToDelete = Sound.findById(req.params.id, function (err, sound) {
    if (err || !sound) {
      if (!sound) {
        err = new Error("Sound not found");
        err.status = 404;
      }
      return next(err);
    }
    User.findById(sound.user, function (err, user) {
      if (err) {
        return next(err);
      }
      if (user._id == req.currentUserId || req.currentUserRole === "admin") {
        Sound.findByIdAndDelete(req.params.id, function (err, sound) {
          if (err) {
            return next(err);
          }
          res.status(204).send("Sound deleted successfully!");
        });
      } else {
        res.status(401).send("You are not authorized to delete this sound");
      }
    });
  });
});

export default router;
