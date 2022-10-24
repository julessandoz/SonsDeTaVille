import mongoose from 'mongoose';
const {Schema} = mongoose.Schema;

// Define a schema
const CategorySchema = new Schema({
    
    category: String,
    color: String,
});

// Create the model from the schema and export it
export default mongoose.model('Category', CategorySchema);