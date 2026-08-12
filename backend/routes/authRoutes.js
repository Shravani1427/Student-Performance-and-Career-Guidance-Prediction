
"use strict";

const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

// =====================================================
// STUDENT REGISTRATION
// POST /api/auth/register
// =====================================================

router.post(
    "/register",
    authController.register
);

// =====================================================
// STUDENT LOGIN
// POST /api/auth/login
// =====================================================

router.post(
    "/login",
    authController.login
);

// =====================================================
// ADMIN LOGIN
// POST /api/auth/admin-login
// =====================================================

router.post(
    "/admin-login",
    authController.adminLogin
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;

