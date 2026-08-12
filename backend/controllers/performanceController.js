const db = require('../config/db');

function pct(value, total) { return total ? Math.round((Number(value) / Number(total)) * 100 * 100) / 100 : 0; }
function grade(value) { if (value >= 90) return 'A+'; if (value >= 80) return 'A'; if (value >= 70) return 'B+'; if (value >= 60) return 'B'; if (value >= 40) return 'C'; return 'F'; }

function canAccess(request, studentId) { return request.user.role === 'admin' || Number(request.user.id) === Number(studentId); }

async function createPerformance(request, response) {
  const { student_id, studentId, subject_name, subjectName, marks_obtained, marksObtained, total_marks, totalMarks, attendance, semester, academic_year, academicYear } = request.body;
  const ownerId = Number(student_id || studentId || request.user.id);
  if (request.user.role !== 'admin' && ownerId !== request.user.id) return response.status(403).json({ success: false, message: 'Students can only add their own performance.' });
  const marks = Number(marks_obtained ?? marksObtained); const total = Number(total_marks ?? totalMarks); const attendanceValue = Number(attendance);
  if (!subject_name && !subjectName) return response.status(400).json({ success: false, message: 'Subject name is required.' });
  if (!Number.isFinite(marks) || !Number.isFinite(total) || marks < 0 || total <= 0 || marks > total) return response.status(400).json({ success: false, message: 'Marks must be valid and obtained marks cannot exceed total marks.' });
  if (!Number.isFinite(attendanceValue) || attendanceValue < 0 || attendanceValue > 100) return response.status(400).json({ success: false, message: 'Attendance must be between 0 and 100.' });
  try {
    const [result] = await db.execute('INSERT INTO performance (student_id,subject_name,marks_obtained,total_marks,attendance,semester,academic_year) VALUES (?,?,?,?,?,?,?)', [ownerId, subject_name || subjectName, marks, total, attendanceValue, Number(semester || 1), academic_year || academicYear || new Date().getFullYear().toString()]);
    const [rows] = await db.execute('SELECT * FROM performance WHERE id=?', [result.insertId]);
    response.status(201).json({ success: true, message: 'Performance record created.', data: rows[0] });
  } catch (error) { console.error('Create performance error:', error); response.status(500).json({ success: false, message: 'Unable to create performance record.' }); }
}

async function getPerformance(request, response) {
  const requestedId = Number(request.query.studentId || request.user.id);
  if (!canAccess(request, requestedId)) return response.status(403).json({ success: false, message: 'You can only view your own performance.' });
  const [rows] = await db.execute('SELECT * FROM performance WHERE student_id=? ORDER BY semester, id', [requestedId]);
  response.json({ success: true, performance: rows, data: rows });
}

async function getPerformanceById(request, response) {
  const [rows] = await db.execute('SELECT * FROM performance WHERE id=?', [request.params.id]);
  if (!rows[0]) return response.status(404).json({ success: false, message: 'Performance record not found.' });
  if (!canAccess(request, rows[0].student_id)) return response.status(403).json({ success: false, message: 'You can only view your own performance.' });
  response.json({ success: true, data: rows[0] });
}

async function updatePerformance(request, response) {
  const [existing] = await db.execute('SELECT * FROM performance WHERE id=?', [request.params.id]);
  if (!existing[0]) return response.status(404).json({ success: false, message: 'Performance record not found.' });
  if (request.user.role !== 'admin' && existing[0].student_id !== request.user.id) return response.status(403).json({ success: false, message: 'You can only update your own performance.' });
  const body = request.body;
  const marks = Number(body.marks_obtained ?? body.marksObtained ?? existing[0].marks_obtained);
  const total = Number(body.total_marks ?? body.totalMarks ?? existing[0].total_marks);
  if (marks < 0 || total <= 0 || marks > total) return response.status(400).json({ success: false, message: 'Marks must be valid and obtained marks cannot exceed total marks.' });
  await db.execute('UPDATE performance SET subject_name=?,marks_obtained=?,total_marks=?,attendance=?,semester=?,academic_year=? WHERE id=?', [body.subject_name || body.subjectName || existing[0].subject_name, marks, total, body.attendance ?? existing[0].attendance, body.semester || existing[0].semester, body.academic_year || body.academicYear || existing[0].academic_year, request.params.id]);
  const [rows] = await db.execute('SELECT * FROM performance WHERE id=?', [request.params.id]);
  response.json({ success: true, message: 'Performance updated.', data: rows[0] });
}

async function deletePerformance(request, response) {
  const [existing] = await db.execute('SELECT student_id FROM performance WHERE id=?', [request.params.id]);
  if (!existing[0]) return response.status(404).json({ success: false, message: 'Performance record not found.' });
  if (request.user.role !== 'admin' && existing[0].student_id !== request.user.id) return response.status(403).json({ success: false, message: 'You can only delete your own performance.' });
  await db.execute('DELETE FROM performance WHERE id=?', [request.params.id]);
  response.json({ success: true, message: 'Performance deleted.' });
}

async function analytics(request, response) {
  const studentId = Number(request.params.studentId);
  if (!canAccess(request, studentId)) return response.status(403).json({ success: false, message: 'You can only view your own analytics.' });
  const [rows] = await db.execute('SELECT subject_name,marks_obtained,total_marks,attendance,semester,academic_year FROM performance WHERE student_id=? ORDER BY semester,id', [studentId]);
  if (!rows.length) return response.json({ success: true, data: { total_subjects: 0, total_marks: '0/0', percentage: 0, grade: 'F', status: 'No data', subjects_passed: 0, subjects_failed: 0, average_attendance: 0, highest_marks: 0, lowest_marks: 0, subjects: [] } });
  const totalMarks = rows.reduce((sum, row) => sum + Number(row.total_marks), 0);
  const obtained = rows.reduce((sum, row) => sum + Number(row.marks_obtained), 0);
  const percentage = pct(obtained, totalMarks);
  const subjects = rows.map((row) => ({ ...row, percentage: pct(row.marks_obtained, row.total_marks), grade: grade(pct(row.marks_obtained, row.total_marks)), status: Number(row.marks_obtained) / Number(row.total_marks) >= 0.4 ? 'Pass' : 'Fail' }));
  response.json({ success: true, data: { total_subjects: rows.length, total_marks: `${obtained}/${totalMarks}`, percentage, grade: grade(percentage), status: subjects.every((row) => row.status === 'Pass') ? 'Pass' : 'Fail', subjects_passed: subjects.filter((row) => row.status === 'Pass').length, subjects_failed: subjects.filter((row) => row.status === 'Fail').length, average_attendance: Math.round(rows.reduce((sum, row) => sum + Number(row.attendance || 0), 0) / rows.length), highest_marks: Math.max(...rows.map((row) => Number(row.marks_obtained))), lowest_marks: Math.min(...rows.map((row) => Number(row.marks_obtained))), subjects } });
}

module.exports = { createPerformance, getPerformance, getPerformanceById, updatePerformance, deletePerformance, analytics };
