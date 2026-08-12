const db = require('../config/db');
const { getStudentSummary } = require('./studentController');

async function getStudents(request, response) { const [rows] = await db.execute('SELECT id,name,email,phone,role,created_at FROM students WHERE role=\'student\' ORDER BY created_at DESC'); response.json({ success: true, data: rows }); }
async function getStudent(request, response) { const student = await getStudentSummary(Number(request.params.id)); if (!student) return response.status(404).json({ success: false, message: 'Student not found.' }); response.json({ success: true, data: student }); }
async function deleteStudent(request, response) { await db.execute('DELETE FROM students WHERE id=? AND role=\'student\'', [request.params.id]); response.json({ success: true, message: 'Student deleted.' }); }
async function getPerformance(request, response) { const [rows] = await db.execute('SELECT p.*,s.name AS student_name,s.email AS student_email FROM performance p JOIN students s ON s.id=p.student_id ORDER BY p.created_at DESC'); response.json({ success: true, data: rows }); }
module.exports = { getStudents, getStudent, deleteStudent, getPerformance };
