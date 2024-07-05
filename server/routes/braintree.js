const express = require("express");
const router = express.Router();

const {
  requireSignin,
  isAuth,
  validateTokenAndCode,
} = require("../controllers/auth");
const { userById } = require("../controllers/user");
const { generateToken, processPayment } = require("../controllers/braintree");

router.get(
  "/braintree/getToken/:userId",
  requireSignin,
  isAuth,
  validateTokenAndCode,
  generateToken
);
router.post(
  "/braintree/payment/:userId",
  requireSignin,
  isAuth,
  validateTokenAndCode,
  processPayment
);

router.param("userId", userById);

module.exports = router;
