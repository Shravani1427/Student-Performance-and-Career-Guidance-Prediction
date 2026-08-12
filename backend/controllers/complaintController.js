const db = require('../config/db');
const categories = ['Performance', 'Career Guidance', 'Login Issue', 'Registration Issue', 'Attendance', 'Reports', 'Other'];

async function createComplaint(request, response) {
  const { subject, message, category } = request.body;
  if (!categories.includes(category)) return response.status(400).json({ success: false, message: 'Please select a valid complaint category.' });
  if (!subject || subject.trim().length < 3) return response.status(400).json({ success: false, message: 'Complaint subject must contain at least 3 characters.' });
  if (!message || message.trim().length < 10) return response.status(400).json({ success: false, message: 'Complaint message must contain at least 10 characters.' });
  const [result] = await db.execute('INSERT INTO complaints (student_id,category,subject,message,status) VALUES (?,?,?,?,\'pending\')', [request.user.id, category, subject.trim(), message.trim()]);
  const [rows] = await db.execute('SELECT * FROM complaints WHERE id=?', [result.insertId]);
  response.status(201).json({ success: true, message: 'Complaint submitted successfully.', data: rows[0] });
}

async function myComplaints(request, response) { const [rows] = await db.execute('SELECT * FROM complaints WHERE student_id=? ORDER BY created_at DESC', [request.user.id]); response.json({ success: true, complaints: rows, data: rows }); }
async function allComplaints(request, response) { const [rows] = await db.execute('SELECT c.*,s.name AS student_name,s.email AS student_email FROM complaints c JOIN students s ON s.id=c.student_id ORDER BY c.created_at DESC'); response.json({ success: true, complaints: rows, data: rows }); }
async function updateComplaint(request, response) { const { status, admin_response, adminResponse } = request.body; if (!['pending','in_progress','resolved'].includes(status)) return response.status(400).json({ success: false, message: 'Status must be pending, in_progress, or resolved.' }); await db.execute('UPDATE complaints SET status=?,admin_response=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, admin_response || adminResponse || null, request.params.id]); const [rows] = await db.execute('SELECT * FROM complaints WHERE id=?', [request.params.id]); if (!rows[0]) return response.status(404).json({ success: false, message: 'Complaint not found.' }); response.json({ success: true, message: 'Complaint updated.', data: rows[0] }); }
async function deleteComplaint(request, response) { await db.execute('DELETE FROM complaints WHERE id=?', [request.params.id]); response.json({ success: true, message: 'Complaint deleted.' }); }
module.exports = { createComplaint, myComplaints, allComplaints, updateComplaint, deleteComplaint };
