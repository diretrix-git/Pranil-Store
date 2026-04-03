const Store = require("../models/Store");
const AppError = require("../utils/AppError");

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});

const getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ _id: req.storeId, isDeleted: false });
    if (!store) return next(new AppError("Store not found.", 404));
    res
      .status(200)
      .json({ status: "success", data: { store }, message: "Store retrieved" });
  } catch (err) {
    next(err);
  }
};

const updateMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ _id: req.storeId, isDeleted: false });
    if (!store) return next(new AppError("Store not found.", 404));
    if (req.file) req.body.logo = req.file.path;
    Object.assign(
      store,
      pick(req.body, [
        "name",
        "logo",
        "address",
        "phone",
        "email",
        "invoiceNote",
      ]),
    );
    await store.save();
    res
      .status(200)
      .json({ status: "success", data: { store }, message: "Store updated" });
  } catch (err) {
    next(err);
  }
};

const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isDeleted: false }).populate(
      "owner",
      "name email",
    );
    res
      .status(200)
      .json({
        status: "success",
        data: { stores, count: stores.length },
        message: "Stores retrieved",
      });
  } catch (err) {
    next(err);
  }
};

const toggleStoreStatus = async (req, res, next) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, isDeleted: false });
    if (!store) return next(new AppError("Store not found.", 404));
    store.isActive = !store.isActive;
    await store.save();
    res.status(200).json({
      status: "success",
      data: { store },
      message: `Store ${store.isActive ? "activated" : "deactivated"}`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyStore, updateMyStore, getAllStores, toggleStoreStatus };
