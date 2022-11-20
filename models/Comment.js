import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema
const commentSchema = new Schema({
    sound: {type: Schema.Types.ObjectId, ref: 'Sound', required: true},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    comment: {type: String, required: [true, 'Comment cannot be empty'], minLength: [1, 'Comment is too short']},
    date: { type: Date, default: Date.now}, // Default value is now
});

// Create the model from the schema and export it
export default mongoose.model('Comment', commentSchema);