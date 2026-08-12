"use strict";

const express = require("express");

const {
    getSubjects,
    getSubjectById,
    addSubject,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

const router = express.Router();

// GET /api/subjects
router.get("/", getSubjects);

// GET /api/subjects/:id
router.get("/:id", getSubjectById);

// POST /api/subjects
router.post("/", addSubject);

// PUT /api/subjects/:id
router.put("/:id", updateSubject);

// DELETE /api/subjects/:id
router.delete("/:id", deleteSubject);

module.exports = router;