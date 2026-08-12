const db = require('../config/db');
const { getStudentSummary } = require('./studentController');

async function studentReport(request, response) {
  const studentId = Number(request.params.studentId);
  if (request.user.role !== 'admin' && request.user.id !== studentId) return response.status(403).json({ success: false, message: 'You can only view your own report.' });
  const report = await getStudentSummary(studentId);
  if (!report) return response.status(404).json({ success: false, message: 'Student not found.' });
  response.json({ success: true, data: report });
}

async function allReports(request, response) {
  const [rows] = await db.execute('SELECT id FROM students WHERE role=\'student\' ORDER BY id');
  const reports = [];
  for (const row of rows) { const report = await getStudentSummary(row.id); if (report) reports.push(report); }
  response.json({ success: true, data: reports });
}
module.exports = { studentReport, allReports };
