"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
async function main() {
    if (!process.env.MONGO_URI)
        throw new Error("MONGO_URI is required");
    await mongoose_1.default.connect(process.env.MONGO_URI, { autoIndex: false });
    try {
        const hello = await mongoose_1.default.connection.db.admin().command({ hello: 1 });
        if (!hello.setName && hello.msg !== "isdbgrid")
            throw new Error("Checkout requires a MongoDB replica set or supported sharded deployment");
        for (const model of [Cart_1.default, Order_1.default, Product_1.default]) {
            await model.createCollection();
            await model.createIndexes();
        }
        console.log("Checkout collections and indexes prepared; existing records and indexes were not dropped");
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
