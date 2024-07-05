const User = require("../models/user");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const { errorHandler } = require("../helpers/dbErrorHandler");
const redisClient = require("../middleware/redisClient");

require("dotenv").config();

exports.signup = (req, res) => {
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err),
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({ user });
  });
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email }, async (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email doesn't exist. Please signup.",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password didn't match",
      });
    }
    const randomCode = Math.random().toString(36).substr(2, 8);

    const token = jwt.sign(
      { _id: user._id, username: user.username, code: randomCode },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    try {
      await redisClient.set(user.username, randomCode);

      res.cookie("t", token, {
        expire: new Date(Date.now() + 9999),
        httpOnly: true,
        secure: true,
      });
      const { _id, username, name, email, role } = user;
      return res.json({
        token,
        user: { _id, username, email, name, role },
        code: randomCode,
      });
    } catch (redisError) {
      return res.status(500).json({ error: "Failed to save session data" });
    }
  });
};

exports.signout = async (req, res) => {
  if (req.auth && req.auth.username) {
    try {
      await redisClient.del(req.auth.username);
    } catch (redisError) {
      console.error("Failed to delete session data from Redis", redisError);
    }
  }
  res.clearCookie("t");
  res.json({ message: "Signout success" });
};

exports.validateTokenAndCode = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const code = req.auth.code;
  const user = req.profile.username;
  if (!authHeader || !code) {
    return res
      .status(401)
      .json({ error: "Access denied. Token and code are required." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token." });
    }

    try {
      const redisCode = await redisClient.get(user);
      // console.log("Redis Code:", redisCode);
      // console.log("Code:", code);
      if (redisCode !== code) {
        return res.status(401).json({ error: "Invalid code." });
      }
      // console.log("decoded", decoded);
      req.auth = decoded;
      // console.log("req.auth: ", req.auth);
      next();
    } catch (redisError) {
      return res.status(500).json({ error: "Failed to validate session data" });
    }
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
  getToken: (req) => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1];
    }
    return null;
  },
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: "Access denied",
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "Admin resource! Access denied",
    });
  }
  next();
};
