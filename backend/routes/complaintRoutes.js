const express = require("express");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const controller = require("../controllers/complaintController");

const router = express.Router();

// =====================================================
// STUDENT COMPLAINT ROUTES
// =====================================================

// Submit a complaint
// POST /api/complaints
router.post("/", auth, controller.createComplaint);

// Get logged-in student's complaints
// GET /api/complaints/my
router.get("/my", auth, controller.myComplaints);

// =====================================================
// ADMIN COMPLAINT ROUTES
// =====================================================

// Get all complaints
// GET /api/complaints
router.get("/", auth, admin, controller.allComplaints);

// Update complaint status / admin response
// PUT /api/complaints/:id
router.put("/:id", auth, admin, controller.updateComplaint);

// Delete complaint
// DELETE /api/complaints/:id
router.delete("/:id", auth, admin, controller.deleteComplaint);

module.exports = router;