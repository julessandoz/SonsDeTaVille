import mongoose from 'mongoose';
const {Schema} = mongoose.Schema;

// Define a schema
const soundSchema = new Schema({
    user: String,
    location: String,
    duration: Number,
    sound: mp3,
    title: String,
    category: String,
    datePub: { type: Date, default: Date.now  }, // Default value
    comments: [ // Nested array of documents
    {
      body: String,
      author: String,
      date: Date
    }
  ],
  meta: { // Nested document
    votes: Number,
    favs: Number
  }
});
// Create the model from the schema and export it
export default mongoose.model('Sound', Soundchema);