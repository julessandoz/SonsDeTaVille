import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema
const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    iconName: { type: String, required: true }
});

// Create the model from the schema and export it
export default mongoose.model('Category', categorySchema);