const express = require("express");
const router = express.Router();

const {
  create,
  categoryById,
  read,
  update,
  remove,
  list,
} = require("../controllers/category");
const {
  requireSignin,
  isAuth,
  isAdmin,
  validateTokenAndCode,
} = require("../controllers/auth");
const { userById } = require("../controllers/user");

router.get("/category/:categoryId", read);
router.post(
  "/category/create/:userId",
  requireSignin,
  isAuth,
  validateTokenAndCode,
  isAdmin,
  create
);
router.put(
  "/category/:categoryId/:userId",
  requireSignin,
  isAuth,
  validateTokenAndCode,
  isAdmin,
  update
);
router.delete(
  "/category/:categoryId/:userId",
  requireSignin,
  isAuth,
  validateTokenAndCode,
  isAdmin,
  remove
);
router.get("/categories", list);

router.param("categoryId", categoryById);
router.param("userId", userById);

module.exports = router;
