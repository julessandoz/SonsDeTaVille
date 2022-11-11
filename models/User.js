import mongoose from "mongoose";
import * as config from "../config.js";
import bcrypt from "bcrypt";
const Schema = mongoose.Schema;

// Define the schema for users
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: [2, "Username is too short, minimum 2 characters"],
    maxLength: [20, "Username is too long, maximum 20 characters"],
  },
  email: { type: String, match: [/^\w+([\.-]?\w+)*@[a-zA-Z]+([\.-]?[a-zA-Z]+)*(\.[a-zA-Z]{2,3})+$/, "Please enter a valid email address"], required: true, unique: true },
  password: { type: String },
  admin: { type: Boolean, default: false }, //Not admin by default
});

userSchema.virtual("clearPassword");

userSchema.pre("save", async function () {
  if (this.clearPassword && this.clearPassword.length >= 8) {
    const hashedPassword = await bcrypt.hash(this.clearPassword, config.bcryptFactor);
    this.password = hashedPassword;
  } else {
    const err = this.clearPassword ? new Error("Password must be 8 characters or longer") : new Error("Password is required");
    err.status = 400;
    throw err; 
}});

userSchema.set("toJSON", {
  transform: transformJsonUser,
});

function transformJsonUser(doc, json, options) {
  // Remove the hashed password from the generated JSON.
  delete json.password;
  delete json.admin;
  return json;
}

// Create the model from the schema and export it
export default mongoose.model("User", userSchema);
