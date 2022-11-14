import express from "express";
import Sound from "../models/Sound.js";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";

const User = mongoose.models.User;

const router = express.Router();
import multer from "multer";
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// GET ALL SOUNDS

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
      }
};
  if (req.query.category) {
    query.category = req.query.category;
  }
  if (req.query.username) {
    User.find({username: req.query.username}).then((user) => {
      query.user = user[0]._id;
    })
  }
  if (req.query.date) {
    // transform date to date object
    const date = new Date(req.query.date);
    query.date = {$gte: date};
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
  Sound.find(query).limit(limit).sort({date: -1}).populate("user").exec(function (err, sounds) {
    if (err) {
      return next(err);
    }
    res.send(sounds);
  });
});

// CREATE A NEW SOUND
router.post("/", upload.single('uploaded_audio'), authenticate, function (req, res, next) {
  const location = JSON.parse(req.body.location);
  const { lat, lng } = location;
  const sound = new Sound({
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },
    category: req.body.category,
    user: req.currentUserId,
    date: new Date(),
    sound: req.file.buffer,
  });
  sound.save(function (err, savedSound) {
    if (err) {
      return next(err);
    }
    res.status(201).send(savedSound);
  });
});

// GET A SOUND BY ID
router.get("/:id", authenticate, function (req, res, next) {
  Sound.findById(req.params.id).populate("user").exec(function (err, sound) {
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
router.patch("/:id", authenticate, function (req, res, next) {
  Sound.findById(req.params.id, function (err, sound) {
    if (err || !sound) {
      if (!sound) {
        err = new Error("Sound not found");
        err.status = 404;
      }
      return next(err);
    }
    if (sound.user != req.currentUserId || req.currentUserRole != "admin") {
      return res.status(401).send("You are not authorized to update this sound");
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
router.delete("/:id", authenticate, function (req, res, next) {
  const soundToDelete = Sound.findById(req.params.id);
  if (soundToDelete.user === req.currentUserId || req.currentUserRole === "admin") {
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
