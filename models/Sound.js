import mongoose from "mongoose";
const { Schema } = mongoose.Schema;
const User = mongoose.model("User", userSchema);
const Category = mongoose.model("Category", categorySchema);

// Define a schema
const soundSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  location: { type: String, required: true },
  sound: { type: Buffer, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  date: { type: Date, default: Date.now }, // Default value is now
});
// Create the model from the schema and export it
export default mongoose.model("Sound", soundSchema);
