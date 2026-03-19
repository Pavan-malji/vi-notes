import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured in backend/.env");
  }

  await mongoose.connect(mongoUri);

  const dbName = mongoose.connection.name;
  const host = mongoose.connection.host;
  console.log(`MongoDB connected successfully: ${host}/${dbName}`);
}
