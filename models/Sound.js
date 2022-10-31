import mongoose from "mongoose";
const { Schema } = mongoose.Schema;

// Define a schema
const soundSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  location: {
    type: { type: String, required: true, enum: ["Point"] },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: validateGeoJsonCoordinates,
        message:
          "{VALUE} is not a valid longitude/latitude(/altitude) coordinates array",
      },
    },
    required: true,
  },
  sound: { type: Buffer, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  date: { type: Date, default: Date.now }, // Default value is now
});

// Create a geospatial index on the location property.
geolocatedSchema.index({ location: "2dsphere" });

// Validate a GeoJSON coordinates array (longitude, latitude and optional altitude).
function validateGeoJsonCoordinates(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.length <= 3 &&
    isLongitude(value[0]) &&
    isLatitude(value[1])
  );
}

function isLatitude(value) {
  return value >= -90 && value <= 90;
}

function isLongitude(value) {
  return value >= -180 && value <= 180;
}

// Create the model from the schema and export it
export default mongoose.model("Sound", soundSchema);
