const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper: Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    // This is shorthand for { id: id }
    expiresIn: "1h",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, avatar } = req.body || {};
  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      avatar,
    });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        avatar: user.avatar,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("authController.registerUser error:", error);
    // handle duplicate key errors with clearer message
    if (error.code === 11000 && error.keyValue && error.keyValue.email) {
      return res.status(400).json({ message: "Email already in use" });
    }
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production" ? "Server Error" : error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body || {};

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    // The + sign: This explicitly tells Mongoose: "I know this field is hidden by default in the Schema, but I want you to force include it for this specific query."

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (error) {
    console.error("authController.loginUser error:", error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production" ? "Server Error" : error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName || "",
      address: user.address || "",
      phone: user.phone || "",
      avatar: user.avatar || "",
    });
  } catch (error) {
    console.error("authController.getMe error:", error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production" ? "Server Error" : error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.businessName = req.body.businessName || user.businessName;
      user.address = req.body.address || user.address;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessName: updatedUser.businessName || "",
        address: updatedUser.address || "",
        phone: updatedUser.phone || "",
        avatar: updatedUser.avatar || "",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("authController.updateUserProfile error:", error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production" ? "Server Error" : error.message,
    });
  }
};
