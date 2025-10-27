import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    logoDefaultUrl: {
      type: String,
      required: true,
    },
    coverDefaultUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
