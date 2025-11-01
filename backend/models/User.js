// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
      select: false,
    },
    businessName: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Change the MongoDB collection (table) name used by this model:
const collectionName = "users"; // <-- set desired collection name here

// If the model was already registered, remove it to avoid OverwriteModelError
if (mongoose.models && mongoose.models.User) {
  if (typeof mongoose.deleteModel === "function") {
    mongoose.deleteModel("User");
  } else {
    delete mongoose.connection.models["User"];
  }
}

// Create and export the model using the explicit collection name
const User = mongoose.model("User", userSchema, collectionName);

module.exports = User;
