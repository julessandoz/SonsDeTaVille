import express from "express";
import Sound from "../models/Sound.js";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";

const User = mongoose.models.User;
const Category = mongoose.models.Category;
const Comment = mongoose.models.Comment;

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
 * @apiParam {String} [lat] Latitude
 * @apiParam {String} [lng] Longitude
 * @apiParam {String} [rad] Radius in meters
 * @apiParam {String} [category] Category id
 * @apiParam {String} [username] Username
 * @apiParam {String} [userId] User ID
 * @apiParam {Date} [date] Date (sounds posted since this date) (ISO 8601)
 * @apiParam {Number} [limit] Limit the number of results
 * @apiParam {Number} [offset] Skip the first n results
 * @apiSuccess {Object[]} sounds List of sounds
 * @apiSuccess {String} sounds._id Sound id
 * @apiSuccess {String} sounds.user User
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
router.get("/", authenticate, async function (req, res, next) {
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
  if (req.query.lat || req.query.lng) {
    if (!req.query.lng || !req.query.lat) {
      err = new Error("Missing location");
      err.status = 400;
      return next(err);
    }
    let location = {
      lat: req.query.lat,
      lng: req.query.lng,
      radius: req.query.rad,
    };
    const maxRadius = 50000;
    const minRadius = 500;
    location.radius = location.radius ? location.radius : maxRadius;
    location.radius = location.radius > maxRadius ? maxRadius : location.radius;
    location.radius = location.radius < minRadius ? minRadius : location.radius;
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [location.lat, location.lng],
        },
        $maxDistance: location.radius,
      },
    };
  }
  try {
    let user, category;
    if (req.query.userId) {
      user = await User.findOne({ _id: req.query.userId });
    } else if (req.query.username) {
      user = await User.findOne({ username: req.query.username });
    }
    if (req.query.category) {
      category = await Category.findById(req.query.category);
    }
    if (!user && !category) {
      if(req.query.userId || req.query.username) {
        return res.status(404).send("User not found");
      }
      if(req.query.category) {
        return res.status(404).send("Category not found");
      }
    }
    if (user) {
      query.user = user._id;
    }
    if (category) {
      query.category = category._id;
    }
    const sounds = await findSounds(query, limit, offset);
    res.send(sounds);
  } catch (err) {
    return next(err);
  }
});

async function findSounds(query, limit, offset) {
  return await Sound.find(query)
    .limit(limit)
    .skip(offset)
    .sort({ date: -1 })
    .populate("user")
    .populate("category")
    .populate("comments")
    .exec();
}

/**
 * @api {post} /sounds Create a new sound
 * @apiName CreateSound
 * @apiGroup Sounds
 * @apiBody {String} category Category of the sound
 * @apiBody {String} lat Latitude of the sound
 * @apiBody {String} lng Longitude of the sound
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
    const lat = req.body.lat;
    const lng = req.body.lng;
    if (!lat || !lng) {
      let err = new Error("Missing location");
      err.status = 400;
      return next(err);
    }
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
        res.status(201).send(
          `Sound successfully created
           Sound id: ${savedSound._id}`
        );
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
    .populate("category")
    .populate([{
      path: "comments",
      model: "Comment",
      populate: {
        path: "author",
        model: "User",
      },
    }])
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
router.get(
  "/data/:id",
  /* authenticate, */ function (req, res, next) {
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
  }
);

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
        Category.findOne(
          { name: req.body.category },
          async function (err, cat) {
            if (err || !cat) {
              if (!cat) {
                err = new Error("Category not found");
                err.status = 404;
              }
              return next(err);
            }
            sound.category = cat._id;
            const updatedSound = await Sound.findByIdAndUpdate(
              sound._id,
              { category: cat._id },
              { new: true }
            );
            res.status(200).send(`Sound updated successfully
           Sound id: ${updatedSound._id}`);
          }
        );
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
  let hasComments = false;
  Sound.findById(req.params.id, function (err, sound) {
    if (err || !sound) {
      if (!sound) {
        err = new Error("Sound not found");
        err.status = 404;
      }
      return next(err);
    }
    sound.comments.length > 0 ? (hasComments = true) : (hasComments = false);
    User.findById(sound.user, function (err, user) {
      if (err) {
        return next(err);
      }

      if (user._id == req.currentUserId || req.currentUserRole === "admin") {
        if (hasComments) {
          Comment.deleteMany({ sound: sound._id }, function (err) {
            if (err) {
              return next(err);
            }
          });
        }
        Sound.findByIdAndDelete(req.params.id, function (err, sound) {
          if (err) {
            return next(err);
          }
          res.status(200).send("Sound deleted successfully!");
        });
      } else {
        res.status(401).send("You are not authorized to delete this sound");
      }
    });
  });
});

export default router;
