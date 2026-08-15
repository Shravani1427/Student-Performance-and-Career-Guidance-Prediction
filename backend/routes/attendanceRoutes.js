"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper: Ensure MySQL table has valid schema
async function initAttendanceTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('P', 'A', 'L') NOT NULL DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_date (student_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error("[ATTENDANCE INIT ERROR]:", err.message);
  }
}
initAttendanceTable();

// ---------------------------------------------------------
// GET /api/attendance?year=2026&month=8
// ---------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1; // 1-12

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // 1. Fetch all students
    const [students] = await db.query(`
      SELECT 
        s.id, 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS studentCode, 
        s.name, 
        s.email, 
        COALESCE(p.course, 'Information Technology') AS department
      FROM students s
      LEFT JOIN profiles p ON p.student_id = s.id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);

    // 2. Fetch recorded attendance for the selected month
    const [records] = await db.query(
      `SELECT student_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, status 
       FROM attendance 
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );

    // Map records into lookup dictionary: { "studentId_YYYY-MM-DD": "P" }
    const recordMap = {};
    for (const r of records) {
      recordMap[`${r.student_id}_${r.date}`] = r.status;
    }

    return res.status(200).json({
      success: true,
      year,
      month,
      daysInMonth: lastDay,
      students,
      attendance: recordMap
    });
  } catch (error) {
    console.error("[ATTENDANCE GET ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------
// POST /api/attendance (Mark or update single day / bulk)
// ---------------------------------------------------------
router.post("/", async (req, res) => {
  const { student_id, date, status } = req.body;

  if (!student_id || !date || !status) {
    return res.status(400).json({ success: false, message: "student_id, date, and status are required." });
  }

  if (!["P", "A", "L"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status. Must be 'P', 'A', or 'L'." });
  }

  try {
    await db.query(
      `INSERT INTO attendance (student_id, date, status) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [student_id, date, status]
    );

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: { student_id, date, status }
    });
  } catch (error) {
    console.error("[ATTENDANCE SAVE ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;