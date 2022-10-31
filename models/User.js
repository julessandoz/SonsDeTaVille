import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Define the schema for users
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: [2, "Username is too short"],
    maxLength: [20, "Username is too long"],
  },
  email: { type: String, match: /.+\@.+\..+/, required: true, unique: true },
  password: { type: String, required: true, minLength: [8, "Password is too short"] },
  admin: { type: Boolean, default: false }, //Not admin by default
});

// Create the model from the schema and export it
export default mongoose.models.User || mongoose.model("User", userSchema);
