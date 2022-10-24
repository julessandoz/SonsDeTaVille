import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define the schema for users
const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
});

// Create the model from the schema and export it
export default mongoose.model('User', userSchema);