import mongoose from 'mongoose';
const {Schema} = mongoose.Schema;

// Define a schema
const CommentSchema = new Schema({
    comment: String,
    author: String,
    date: Date,
});

// Create the model from the schema and export it
export default mongoose.model('Comment', CommentSchema);