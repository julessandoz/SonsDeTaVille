import express from "express";
import { authenticate } from "./auth.js";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const router = express.Router();

/**
 * @api {options} /categories Get allowed methods
 * @apiName OptionsCategories
 * @apiGroup Categories
 * @apiDescription Get allowed methods
 * @apiSuccessExample {text} Success-Response:
 * HTTP/1.1 204 No Content
 * Allow: GET, POST, DELETE, OPTIONS
 */
router.options("/", function (req, res, next) {
  res.set("Allow", "GET, POST, DELETE, OPTIONS");
  res.status(204).send();
});

/**
 * @api {get} /categories Get all categories
 * @apiName GetCategories
 * @apiGroup Categories
 * @apiSuccess {Object[]} categories List of categories
 * @apiSuccess {String} categories._id Category id
 * @apiSuccess {String} categories.name Category name
 * @apiSuccess {String} categories.iconName Category iconName
 * @apiSuccessExample {json} Success
 *  HTTP/1.1 200 OK
 * [
 * {
 *  "_id": "5f7b9b9b9b9b9b9b9b9b9b9b",
 * "name": "Animaux",
 * "iconName": "paw",
 * "__v": 0
 * }
 * ]
 */

router.get("/", authenticate, function (req, res, next) {
  Category.find()
    .sort("name")
    .exec(function (err, categories) {
      if (err) {
        return next(err);
      }
      res.send(categories);
    });
});

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
 * "iconName": "paw",
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

/**
 * @api {post} /categories Create a new category
 * @apiName CreateCategory
 * @apiGroup Categories
 * @apiBody {String} name Category name
 * @apiBody {String} iconName Category ionic icon name
 * @apiPermission admin
 * @apiSuccess {String} Message Category successfully created
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 *
 * Category successfully created
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
      return next(err);
    }
    res.status(201).send("Category successfully created");
  });
});

/**
 * @api {delete} /categories/:name Delete a category
 * @apiName DeleteCategory
 * @apiGroup Categories
 * @apiParam {String} name Category name
 * @apiPermission admin
 * @apiSuccess {String} Message Category successfully deleted
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 *
 * Category successfully deleted
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
  Category.findOneAndDelete(
    { name: req.params.name },
    function (err, category) {
      if (err) {
        return next(err);
      }
      res.status(200).send("Category successfully deleted");
    }
  );
});

export default router;
