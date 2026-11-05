import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    const hello = await conn.connection.db!.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      throw new Error("Checkout requires a MongoDB replica set or supported sharded deployment; standalone MongoDB is unsupported");
    }
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err: any) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
