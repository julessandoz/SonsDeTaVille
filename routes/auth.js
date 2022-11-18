import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import * as config from "../config.js";
const secretKey = config.jwtSecret;

const router = express.Router();

export function authenticate(req, res, next) {
    // Ensure the header is present.
    const authorization = req.get("Authorization");
    if (!authorization) {
      return res.status(401).send("Authorization header is missing");
    }
    // Check that the header has the correct format.
    const match = authorization.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).send("Authorization header is not a bearer token");
    }
    // Extract and verify the JWT.
    const token = match[1];
    jwt.verify(token, secretKey, function(err, payload) {
      if (err) {
        return res.status(401).send("Your token is invalid or has expired");
      } else {
        req.currentUserRole = payload.scope;
        req.currentUserId = payload.sub;
        next(); // Pass the ID of the authenticated user to the next middleware.
      }
    });
  }

export function tokenToUser(token) {
  const payload = jwt.verify(token, secretKey);
    return payload.sub;
}

/**
 * @api {post} /auth/login Login
 * @apiGroup Auth
 * @apiName Login
 * @apiBody {String} email Email address of the user
 * @apiBody {String} password Password of the user
 * @apiSuccess {String} token JWT token
 * @apiSuccessExample {json} Success
 * HTTP/1.1 200 OK
 * {
 * token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 * }
 */
  router.post("/login", function(req, res, next) {
    // Find the user by name.
    User.findOne({ email: req.body.email }).exec(function(err, user) {
      if (err) { return next(err); }
      else if (!user) { return res.sendStatus(401); }
      // Validate the password.
      bcrypt.compare(req.body.password, user.password, function(err, valid) {
        if (err) { return next(err); }
        else if (!valid) { return res.sendStatus(401); }
        // Generate a valid JWT which expires in 7 days.
        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const role = user.admin ? "admin" : "user";
        const payload = { sub: user._id.toString(), exp: exp, scope: role };
        jwt.sign(payload, secretKey, function(err, token) {
          if (err) { return next(err); }
          res.send({ token: token }); // Send the token to the client.
        });
      });
    })
  });

export default router;