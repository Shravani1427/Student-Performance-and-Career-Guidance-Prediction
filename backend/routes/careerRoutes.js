
"use strict";

const express = require("express");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const controller = require("../controllers/careerController");

const router = express.Router();

/*
=====================================================
CAREER MANAGEMENT
=====================================================
*/

// Get all careers
router.get(
    "/careers",
    auth,
    controller.getCareers
);

// Get one career
router.get(
    "/careers/:id",
    auth,
    controller.getCareer
);

// Create career - Admin only
router.post(
    "/careers",
    auth,
    admin,
    controller.createCareer
);

// Update career - Admin only
router.put(
    "/careers/:id",
    auth,
    admin,
    controller.updateCareer
);

// Delete career - Admin only
router.delete(
    "/careers/:id",
    auth,
    admin,
    controller.deleteCareer
);


/*
=====================================================
CAREER PREDICTION
=====================================================
*/

router.post(
    "/career/predict",
    auth,
    controller.predictCareer
);

router.get(
    "/career/recommendations",
    auth,
    controller.recommendations
);


/*
=====================================================
CAREER ASSESSMENT
=====================================================
*/

// Get 10 career questions
router.get(
    "/career/questions",
    auth,
    controller.questions
);

// Submit career assessment
router.post(
    "/career/submit",
    auth,
    controller.submitAssessment
);

// Reset career assessment - Admin only
router.post(
    "/career/reset/:studentId",
    auth,
    admin,
    controller.resetCareer
);

// Get career result
router.get(
    "/career/result/:studentId",
    auth,
    controller.recommendations
);


/*
=====================================================
EXPORT ROUTER
=====================================================
*/

module.exports = router;

