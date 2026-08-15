"use strict";

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const controller = require('../controllers/studentController');

// ---------------------------------------------------------
// 1. GET ALL STUDENTS
// Supports: GET /api/students, GET /api/admin/students
// ---------------------------------------------------------
router.get('/', auth, controller.getAllStudents);
router.get('/all', auth, controller.getAllStudents);
router.get('/admin', auth, admin, controller.getAllStudents);

// ---------------------------------------------------------
// 2. PROFILE ROUTES (Must be placed before /:id)
// ---------------------------------------------------------
router.get('/profile', auth, controller.getProfile);
router.put('/profile', auth, controller.updateProfile);

// ---------------------------------------------------------
// 3. CREATE STUDENT (Admin only)
// Supports: POST /api/students, POST /api/admin/students
// ---------------------------------------------------------
router.post('/', auth, admin, controller.createStudent);
router.post('/add', auth, admin, controller.createStudent);

// ---------------------------------------------------------
// 4. SINGLE STUDENT CRUD OPERATIONS
// ---------------------------------------------------------
router.get('/:id', auth, controller.getStudent);
router.put('/:id', auth, controller.updateStudent);
router.delete('/:id', auth, admin, controller.deleteStudent);

module.exports = router;