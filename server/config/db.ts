import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err: any) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
