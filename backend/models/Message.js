import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      default: "user",
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    room: {
      type: String,
      default: "general",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
