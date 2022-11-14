import express from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const router = express.Router();
// create apidoc comment
/**
 * @api {get} /categories Get all categories
 * @apiName GetCategories
 * @apiGroup Categories
 * @apiSuccess {Object[]} categories List of categories
 * @apiSuccess {String} categories._id Category id
 * @apiSuccess {String} categories.name Category name
 * @apiSuccess {String} categories.color Category color
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * [
 * {
 *  "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "name": "Animaux",
 * "color": "red",
 * "__v": 0
 * }
 * ]
 */

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
        if (err || !category) {
            if (!category) {
                err = new Error("Category not found");
                err.status = 404;
            }
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
        if (err || !category) {
            if (!category) {
                err = new Error("Category not found");
                err.status = 404;
            }
        return next(err);
        }
        res.send(category);
    });
    });



export default router;