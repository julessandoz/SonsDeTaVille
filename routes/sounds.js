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
 *  }
 * ]
 */
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
    .populate("category")
    .populate("comments")
    .exec(function (err, sounds) {
      if (err) {
        return next(err);
      }
      res.send(sounds);
    });
});

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
 *    ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_�\��G���:�@���RhM�O�΁ Pj8�=���4�y�� 1\{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm
��P.���f?�&�0��!p=�YI���h1����>~�$���+Z������Z���!�h�<?�z��egy��G{��c��ǹc��	�Y�ɩ�ٱ$�x�@;lx�JZؼ��,?H��'R������M)�;WQ޷(yN�{D���7'*�I5�ٔa8R���n6Ԭ0�9$L���֓WcH8\��?�p�vr�.H���4�D+R�!Ri������\}�:;�F��Z�J���3�����F�42�+���#4�+?oHZ�9��'�Cx$�
^�).>�:5�D��4��ֱ��wp��fn�Q�s0H���iT'}�ܷ3��p�{�#4*w,�9�[3[$��,�tO��@�<ټ��)���ԗ\������I0!�0�f�r��4��穩�Q)�X� ͺ�����v2�s{���P�����k�F����%�*���3
�W���*�s3ӟz���J~9w�ט���r��X_a옋�i�-��b;.<���8��u~�bָ��1a����/�C����%��:&a��
H~�h�tkZ�o�p��g�Lj��͏OGGu���h+*�z7+�����d}{�Bz�J
�2�g������}�{��'���٘��0��k�셑�R�zL|���`�"H�$w�(��Z� pJ�TQ4J�K���e]݈@�bG�4zC`n�g���z��k����7���j�N��B�j=o��<l���ھ=r���5�]����E�(=]L�w��H�!�R�-!y�k��<�$:S<0�mm!6&ԭ����_�<J+=����vEuO� �<��DY4B��Q��2
p��qxTZ��d��LP���s�S1J.A�*����֪����l� ��nC���7:���F�1�.� �R9�ȡYL!]A)'�N���y�v-�����~{l��́��M���q��C�5�rDM��+x ��1�76�+1��>b�8<�,Ta(J�'K<�Yv:	 �V�r |,�9꼂Z��ٍ}���Dޟg'*T
m�����|Lj
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
 * @apiBody {String} category Category of the sound
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
    if (sound.user != req.currentUserId || req.currentUserRole != "admin") {
      return res
        .status(401)
        .send("You are not authorized to update this sound");
    }
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
