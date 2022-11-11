import User from "../models/User.js"
import jwt from "jsonwebtoken"
import { jwtSecret } from "../config.js";

export const cleanUpDatabase = async function() {
  await Promise.all([
    User.deleteMany()
  ]);
};

export function generateValidJwt(user) {
  // Generate a valid JWT which expires in 7 days.
  const exp = (new Date().getTime() + 7 * 24 * 3600 * 1000) / 1000;
  const claims = { sub: user._id.toString(), exp: exp };
  return new Promise((resolve, reject) => {
    jwt.sign(claims, jwtSecret, function(err, token) {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}