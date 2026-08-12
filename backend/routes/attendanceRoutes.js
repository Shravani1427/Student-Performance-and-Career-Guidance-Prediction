"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/attendance?studentId=X
router.get("/", async (req, res) => {
  try {
    const studentId = req.query.studentId;
    let query = "SELECT * FROM attendance";
    let params = [];

    if (studentId) {
      query += " WHERE student_id = ? ORDER BY date DESC";
      params.push(studentId);
    } else {
      query += " ORDER BY date DESC";
    }

    const [rows] = await db.query(query, params);

    // Map column names to frontend expectations
    const formatted = rows.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      subjectId: r.subject_id,
      date: r.date,
      status: r.status
    }));

    return res.json({ success: true, attendance: formatted });
  } catch (error) {
    console.error("Attendance fetch error:", error);
    return res.status(500).json({ success: false, message: "Database query failed" });
  }
});

// POST /api/attendance
router.post("/", async (req, res) => {
  try {
    const { studentId, subjectId, attendanceDate, status } = req.body;

    const query = `
      INSERT INTO attendance (student_id, subject_id, date, status) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    const [result] = await db.query(query, [
      studentId,
      subjectId || null,
      attendanceDate || new Date().toISOString().slice(0, 10),
      status
    ]);

    return res.json({
      success: true,
      message: "Attendance recorded successfully",
      id: result.insertId
    });
  } catch (error) {
    console.error("Attendance save error:", error);
    return res.status(500).json({ success: false, message: "Failed to save attendance" });
  }
});

// DELETE /api/attendance/:id
router.delete("/:id", async (req, res) => {
  try {
    const recordId = req.params.id;
    await db.query("DELETE FROM attendance WHERE id = ?", [recordId]);
    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete record" });
  }
});

module.exports = router;