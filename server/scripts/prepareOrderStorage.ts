import mongoose from "mongoose";
import Cart from "../models/Cart";
import Order from "../models/Order";
import Product from "../models/Product";

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  try {
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") throw new Error("Checkout requires a MongoDB replica set or supported sharded deployment");
    for (const model of [Cart, Order, Product]) {
      await model.createCollection();
      await model.createIndexes();
    }
    console.log("Checkout collections and indexes prepared; existing records and indexes were not dropped");
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
