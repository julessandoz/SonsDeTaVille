import express from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const router = express.Router();

// GET LIST OF ALL CATEGORIES
router.get("/", authenticate, function (req, res, next) {
  Category.find().sort("name").exec(function (err, categories) {
    if (err) {
      return next(err);
    }
    res.send(categories);
  });
});

// FIND CATEGORY BY NAME
router.get("/:name", authenticate, function (req, res, next) {
    Category.findOne({ name: req.params.name }, function (err, category) {
        if (err) {
        return next(err);
        }
        res.send(category);
    });
    });

// CREATE NEW CATEGORY
router.post("/", authenticate, function (req, res, next) {
    if (req.currentUserRole != "admin") {
        return res.status(401).send("Unauthorized");
    }
    const category = new Category({ name: req.body.name, color: req.body.color });
    category.save(function (err, savedCategory) {
    if (err) {
        console.log(err);
        return next(err);
    }
    res.status(201).send(savedCategory);
    });
    }
);

// DELETE CATEGORY
router.delete("/:name", authenticate, function (req, res, next) {
    if (req.currentUserRole != "admin") {
        return res.status(401).send("Unauthorized");
    }
    Category.findOneAndDelete({ name: req.params.name }, function (err, category) {
        if (err) {
        return next(err);
        }
        res.send(category);
    });
    });



export default router;