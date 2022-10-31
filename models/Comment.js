import mongoose from 'mongoose';
const {Schema} = mongoose.Schema;
const User = mongoose.model('User', userSchema);
const Sound = mongoose.model('Sound', soundSchema);

// Define a schema
const commentSchema = new Schema({
    sound: {type: Schema.Types.ObjectId, ref: 'Sound', required: true},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    comment: {type: String, required: true, minLength: [1, 'Comment is too short']},
    date: { type: Date, default: Date.now}, // Default value is now
});

// Create the model from the schema and export it
export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);