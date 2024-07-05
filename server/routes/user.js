const express = require("express");
const router = express.Router();

const {
  requireSignin,
  isAuth,
  isAdmin,
  validateTokenAndCode,
} = require("../controllers/auth");

const {
  userById,
  read,
  update,
  purchaseHistory,
} = require("../controllers/user");

router.get("/secret/:userId", requireSignin, isAuth, isAdmin, (req, res) => {
  res.json({
    user: req.profile,
  });
});

router.get("/user/:userId", requireSignin, validateTokenAndCode, isAuth, read);
router.put(
  "/user/:userId",
  requireSignin,
  validateTokenAndCode,
  isAuth,
  update
);
router.get(
  "/orders/by/user/:userId",
  requireSignin,
  validateTokenAndCode,
  isAuth,
  purchaseHistory
);

router.param("userId", userById);

module.exports = router;
