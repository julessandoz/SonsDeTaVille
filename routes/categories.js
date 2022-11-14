import express from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const router = express.Router();


// GET LIST OF ALL CATEGORIES
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

router.get("/", authenticate, function (req, res, next) {
  Category.find().sort("name").exec(function (err, categories) {
    if (err) {
      return next(err);
    }
    res.send(categories);
  });
});

// FIND CATEGORY BY NAME
/**
 * @api {get} /categories/:name Get a category by name
 * @apiName GetCategoryByName
 * @apiGroup Categories
 * @apiParam {String} name Category name
 * @apiSuccess {String} _id Category id
 * @apiSuccess {String} name Category name
 * @apiSuccess {String} color Category color
 * @apiSuccess {Object[]} categories List of categories
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
 * @apiErrorExample {json} List error
 * HTTP/1.1 404 Not Found
 * {
 * "message": "Category not found"
 * }
 */

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
/**
 * @api {post} /categories Create a new category
 * @apiName CreateCategory
 * @apiGroup Categories
 * @apiBody {String} name Category name
 * @apiBody {String} color Category color
 * @apiPermission admin
 * @apiSuccess {String} _id Category id
 * @apiSuccess {String} name Category name
 * @apiSuccess {String} color Category color
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "name": "Animaux",
 * "color": "red",
 * "__v": 0
 * }
 * @apiErrorExample {json} List error
 * HTTP/1.1 401 Unauthorized
 * {
 * "message": "Unauthorized"
 * }
 */

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
/**
    * @api {delete} /categories/:name Delete a category
    * @apiName DeleteCategory
    * @apiGroup Categories
    * @apiParam {String} name Category name
    * @apiPermission admin
    * @apiSuccess {String} message Category deleted
    * @apiSuccessExample {json} Success
    * HTTP/1.1 200 OK
    * {
    * "message": "Category deleted"
    * }
    * @apiErrorExample {json} Category not found
    * HTTP/1.1 404 Not Found
    * {
    * "message": "Category not found"
    * }
*/

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