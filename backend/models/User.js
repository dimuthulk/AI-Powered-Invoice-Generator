// models/User.js (CommonJS)
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
      select: false, //tells Mongoose: "Whenever someone fetches a user (e.g., to display a profile), DO NOT include the password in the result."
    },
    businessName: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const collectionName = "users";

if (mongoose.models && mongoose.models.User) {
  if (typeof mongoose.deleteModel === "function") {
    mongoose.deleteModel("User");
  } else {
    delete mongoose.connection.models["User"];
  }
}

const User = mongoose.model("User", userSchema, collectionName);

module.exports = User;
