const express = require('express');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const controller = require('../controllers/studentController');
const router = express.Router();

// ---------------------------------------------------------
// 1. GET ALL STUDENTS (Fixes GET /api/students & GET /api/admin/students)
// ---------------------------------------------------------
// Handles GET /api/students
router.get('/', auth, controller.getAllStudents || controller.getStudents);

// Handles GET /api/admin/students if mounted directly
router.get('/admin', auth, admin, controller.getAllStudents || controller.getStudents);

// ---------------------------------------------------------
// 2. PROFILE ROUTES
// ---------------------------------------------------------
router.get('/profile', auth, controller.getProfile);
router.put('/profile', auth, controller.updateProfile);

// ---------------------------------------------------------
// 3. CREATE, GET ONE, UPDATE, DELETE
// ---------------------------------------------------------
router.post('/', auth, admin, controller.createStudent);
router.get('/:id', auth, controller.getStudent);
router.put('/:id', auth, controller.updateStudent);
router.delete('/:id', auth, admin, controller.deleteStudent);

module.exports = router;