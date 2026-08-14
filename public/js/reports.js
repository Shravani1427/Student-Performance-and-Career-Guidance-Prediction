"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Calculate Start Date Based on Range String
function getStartDateForRange(range, customStart) {
  if (range === "custom" && customStart) return customStart;

  const d = new Date();
  if (range === "1m") d.setMonth(d.getMonth() - 1);
  else if (range === "3m") d.setMonth(d.getMonth() - 3);
  else if (range === "6m") d.setMonth(d.getMonth() - 6);
  else if (range === "1y") d.setFullYear(d.getFullYear() - 1);
  else d.setMonth(d.getMonth() - 1);

  return d.toISOString().slice(0, 10);
}

// Convert Array to CSV / Excel compatible format
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return "No records found\n";
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = String(row[header] ?? "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

function sendCSVResponse(res, filename, rows) {
  const csvData = convertToCSV(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).send(csvData);
}

function sendPDFResponse(res, title, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    rows = [{ Status: "No records found for the selected period." }];
  }
  const headers = Object.keys(rows[0]);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
        h1 { color: #ff2a75; margin-bottom: 5px; }
        p { color: #64748b; font-size: 14px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
        th { background-color: #f8fafc; font-weight: bold; color: #0f172a; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body onload="window.print()">
      <h1>${title}</h1>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h.toUpperCase()}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? "—"}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).send(html);
}

// ---------------------------------------------------------
// 1. ALL STUDENTS REPORT (Pulls from Users & Students)
// ---------------------------------------------------------
router.get("/students/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID,
        name AS NAME,
        email AS EMAIL,
        COALESCE(department, course, 'General') AS DEPARTMENT
      FROM (
        SELECT id, name, email, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, email, department, course FROM students
      ) AS all_students
      ORDER BY id DESC
    `);
    return sendPDFResponse(res, "All Student Profiles Directory", rows);
  } catch (err) {
    try {
      const [fallback] = await db.query(
        "SELECT CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID, name AS NAME, email AS EMAIL, COALESCE(department, course, 'General') AS DEPARTMENT FROM students ORDER BY id DESC"
      );
      return sendPDFResponse(res, "All Student Profiles Directory", fallback);
    } catch (e) {
      return res.status(500).send("Database Error: " + err.message);
    }
  }
});

router.get("/students/excel", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID,
        name AS NAME,
        email AS EMAIL,
        COALESCE(department, course, 'General') AS DEPARTMENT
      FROM (
        SELECT id, name, email, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, email, department, course FROM students
      ) AS all_students
      ORDER BY id DESC
    `);
    return sendCSVResponse(res, "All_Students_Report", rows);
  } catch (err) {
    try {
      const [fallback] = await db.query(
        "SELECT CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID, name AS NAME, email AS EMAIL, COALESCE(department, course, 'General') AS DEPARTMENT FROM students ORDER BY id DESC"
      );
      return sendCSVResponse(res, "All_Students_Report", fallback);
    } catch (e) {
      return res.status(500).send("Database Error: " + err.message);
    }
  }
});

// ---------------------------------------------------------
// 2. ATTENDANCE REPORT
// ---------------------------------------------------------
router.get("/attendance/excel", async (req, res) => {
  const { range, startDate, endDate } = req.query;
  const fromDate = getStartDateForRange(range, startDate);
  const toDate = endDate || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.query(
      `SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(s.department, s.course, 'General') AS Department,
        COUNT(CASE WHEN a.status IN ('P', 'present') THEN 1 END) AS Total_Present,
        COUNT(CASE WHEN a.status IN ('A', 'absent') THEN 1 END) AS Total_Absent,
        COUNT(CASE WHEN a.status = 'HD' THEN 1 END) AS Total_Half_Day,
        COUNT(CASE WHEN a.status = 'L' THEN 1 END) AS Total_Leave
       FROM (
         SELECT id, name, department, course FROM users WHERE role = 'student'
         UNION
         SELECT id, name, department, course FROM students
       ) s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= ? AND a.date <= ?
       GROUP BY s.id, s.name, s.department, s.course
       ORDER BY s.id DESC`,
      [fromDate, toDate]
    );
    return sendCSVResponse(res, `Attendance_Report_${range || "all"}`, rows);
  } catch (err) {
    console.error("❌ Attendance export error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

router.get("/attendance/pdf", async (req, res) => {
  const { range, startDate, endDate } = req.query;
  const fromDate = getStartDateForRange(range, startDate);
  const toDate = endDate || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.query(
      `SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(s.department, s.course, 'General') AS Department,
        COUNT(CASE WHEN a.status IN ('P', 'present') THEN 1 END) AS Present,
        COUNT(CASE WHEN a.status IN ('A', 'absent') THEN 1 END) AS Absent,
        COUNT(CASE WHEN a.status = 'HD' THEN 1 END) AS Half_Day,
        COUNT(CASE WHEN a.status = 'L' THEN 1 END) AS Leave_Days
       FROM (
         SELECT id, name, department, course FROM users WHERE role = 'student'
         UNION
         SELECT id, name, department, course FROM students
       ) s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= ? AND a.date <= ?
       GROUP BY s.id, s.name, s.department, s.course
       ORDER BY s.id DESC`,
      [fromDate, toDate]
    );
    return sendPDFResponse(res, `Attendance Report Summary (${fromDate} to ${toDate})`, rows);
  } catch (err) {
    console.error("❌ Attendance PDF error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// 3. PERFORMANCE REPORT
// ---------------------------------------------------------
router.get("/performance/excel", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(s.department, s.course, 'General') AS Department,
        COALESCE(p.subject_name, 'General Assessment') AS Subject,
        CONCAT(COALESCE(p.marks_obtained, 0), '/', COALESCE(p.total_marks, p.max_marks, 100)) AS Marks,
        COALESCE(p.grade, 'N/A') AS Grade
      FROM (
        SELECT id, name, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, department, course FROM students
      ) s
      LEFT JOIN performance p ON s.id = p.student_id
      ORDER BY s.id DESC
    `);
    return sendCSVResponse(res, "Performance_Report", rows);
  } catch (err) {
    console.error("❌ Performance export error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

router.get("/performance/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(p.subject_name, 'General Assessment') AS Subject,
        CONCAT(COALESCE(p.marks_obtained, 0), '/', COALESCE(p.total_marks, p.max_marks, 100)) AS Marks,
        COALESCE(p.grade, 'N/A') AS Grade
      FROM (
        SELECT id, name, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, department, course FROM students
      ) s
      LEFT JOIN performance p ON s.id = p.student_id
      ORDER BY s.id DESC
    `);
    return sendPDFResponse(res, "Academic Performance Report", rows);
  } catch (err) {
    console.error("❌ Performance PDF error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// 4. COMPLETE COLLEGE DIRECTORY (Main Buttons)
// ---------------------------------------------------------
router.get("/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(id, 4, '0')) AS ID,
        name AS NAME,
        email AS EMAIL,
        COALESCE(department, course, 'General') AS DEPARTMENT
      FROM (
        SELECT id, name, email, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, email, department, course FROM students
      ) AS all_students
      ORDER BY id DESC
    `);
    return sendPDFResponse(res, "Complete College Directory Report", rows);
  } catch (err) {
    console.error("❌ Complete PDF error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

router.get("/excel", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(id, 4, '0')) AS ID,
        name AS NAME,
        email AS EMAIL,
        COALESCE(department, course, 'General') AS DEPARTMENT
      FROM (
        SELECT id, name, email, department, course FROM users WHERE role = 'student'
        UNION
        SELECT id, name, email, department, course FROM students
      ) AS all_students
      ORDER BY id DESC
    `);
    return sendCSVResponse(res, "Complete_College_Report", rows);
  } catch (err) {
    console.error("❌ Complete Excel error:", err.message);
    return res.status(500).send("Database Error: " + err.message);
  }
});

module.exports = router;