import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IWritingSession extends Document {
  userId: Types.ObjectId;
  content: string;
  wordCount: number;
  charCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const writingSessionSchema = new Schema<IWritingSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      default: "",
    },
    wordCount: {
      type: Number,
      required: true,
      default: 0,
    },
    charCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const WritingSession = mongoose.model<IWritingSession>(
  "WritingSession",
  writingSessionSchema,
);
