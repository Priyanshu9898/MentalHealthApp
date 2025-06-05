// routes/auth.js

import express from "express";
import { check, validationResult } from "express-validator";

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/AuthController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  [
    check("name", "Name is required").trim().notEmpty(),
    check("email", "Please include a valid email")
      .trim()
      .isEmail()
      .normalizeEmail(),
    check("password", "Password must be 6 or more characters").isLength({
      min: 6,
    }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    return registerUser(req, res, next);
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  "/login",
  [
    check("email", "Please include a valid email")
      .trim()
      .isEmail()
      .normalizeEmail(),
    check("password", "Password is required").exists(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    return loginUser(req, res, next);
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user info
 * @access  Private
 */
router.get("/me", authMiddleware, (req, res, next) => {
  return getCurrentUser(req, res, next);
});

export default router;
