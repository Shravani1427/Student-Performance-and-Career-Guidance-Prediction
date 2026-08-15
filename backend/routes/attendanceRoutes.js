"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Ensure MySQL attendance table exists with unique student_id + date constraint
async function initTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('P', 'A', 'L') NOT NULL DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_student_date (student_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.error("[ATTENDANCE TABLE INIT]:", e.message);
  }
}
initTable();

// ---------------------------------------------------------
// GET /api/attendance?year=2026&month=1
// ---------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    const year = Number(req.query.year) || 2026;
    const month = Number(req.query.month) || 1; // 1 to 12

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    // 1. Fetch all real students from MySQL
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

    // 2. Fetch recorded attendance for this specific year & month
    const [records] = await db.query(
      `SELECT student_id, DATE_FORMAT(date, '%Y-%m-%d') AS date, status 
       FROM attendance 
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );

    // Build lookup dictionary: { "studentId_YYYY-MM-DD": "P" | "A" | "L" }
    const attendanceMap = {};
    for (const r of records) {
      attendanceMap[`${r.student_id}_${r.date}`] = r.status;
    }

    return res.status(200).json({
      success: true,
      year,
      month,
      daysInMonth,
      students,
      attendance: attendanceMap
    });
  } catch (error) {
    console.error("[ATTENDANCE GET ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------
// POST /api/attendance (Save/Update single cell)
// ---------------------------------------------------------
router.post("/", async (req, res) => {
  const { student_id, date, status } = req.body;

  if (!student_id || !date || !status) {
    return res.status(400).json({ success: false, message: "student_id, date, and status are required." });
  }

  if (!["P", "A", "L"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status. Use 'P', 'A', or 'L'." });
  }

  try {
    await db.query(
      `INSERT INTO attendance (student_id, date, status) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [student_id, date, status]
    );

    return res.status(200).json({ success: true, message: "Attendance saved." });
  } catch (error) {
    console.error("[ATTENDANCE SAVE ERROR]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;