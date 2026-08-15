"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
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

function sendCSVResponse(res, filename, rows) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(200).send("Student_ID,Name,Email,Department\nNo records found,,,");
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const escaped = String(row[header] ?? "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return res.status(200).send(csvRows.join("\n"));
}

function sendPDFResponse(res, title, rows) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!Array.isArray(rows) || rows.length === 0) {
    rows = [{ Message: "No student records found in database" }];
  }

  const headers = Object.keys(rows[0]);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
        h1 { color: #ff2a75; margin-bottom: 5px; font-size: 24px; }
        p { color: #64748b; font-size: 13px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
        th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body onload="window.print()">
      <h1>${title}</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h.replace(/_/g, " ")}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${headers
                  .map((h) => `<td>${row[h] !== null && row[h] !== undefined ? row[h] : "—"}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return res.status(200).send(html);
}

// ---------------------------------------------------------
// 1. ALL STUDENTS REPORT
// ---------------------------------------------------------
router.get("/students/excel", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Name, 
        s.email AS Email, 
        COALESCE(p.course, 'Information Technology') AS Department, 
        s.created_at AS Registered_Date 
      FROM students s
      LEFT JOIN profiles p ON p.student_id = s.id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendCSVResponse(res, "All_Students_Report", rows);
  } catch (error) {
    console.error("[REPORTS /students/excel ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

router.get("/students/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Name, 
        s.email AS Email, 
        COALESCE(p.course, 'Information Technology') AS Department,
        s.created_at AS Registered_Date
      FROM students s
      LEFT JOIN profiles p ON p.student_id = s.id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendPDFResponse(res, "All Student Profiles Directory", rows);
  } catch (error) {
    console.error("[REPORTS /students/pdf ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
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
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(p.course, 'Information Technology') AS Department,
        COUNT(CASE WHEN a.status = 'P' THEN 1 END) AS Total_Present,
        COUNT(CASE WHEN a.status = 'A' THEN 1 END) AS Total_Absent,
        COUNT(CASE WHEN a.status = 'HD' THEN 1 END) AS Total_Half_Day,
        COUNT(CASE WHEN a.status = 'L' THEN 1 END) AS Total_Leave,
        CONCAT(COALESCE(ROUND((COUNT(CASE WHEN a.status = 'P' THEN 1 END) + (COUNT(CASE WHEN a.status = 'HD' THEN 1 END) * 0.5)) / NULLIF(COUNT(a.id), 0) * 100, 2), 0), '%') AS Attendance_Percentage
      FROM students s 
      LEFT JOIN profiles p ON p.student_id = s.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= ? AND a.date <= ?
      WHERE s.role = 'student' OR s.role IS NULL
      GROUP BY s.id, s.name, p.course
      ORDER BY s.id DESC
    `, [fromDate, toDate]);
    return sendCSVResponse(res, `Attendance_Report_${range || "all"}`, rows);
  } catch (error) {
    console.error("[REPORTS /attendance/excel ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

router.get("/attendance/pdf", async (req, res) => {
  const { range, startDate, endDate } = req.query;
  const fromDate = getStartDateForRange(range, startDate);
  const toDate = endDate || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(p.course, 'Information Technology') AS Department,
        COUNT(CASE WHEN a.status = 'P' THEN 1 END) AS Present,
        COUNT(CASE WHEN a.status = 'A' THEN 1 END) AS Absent,
        COUNT(CASE WHEN a.status = 'HD' THEN 1 END) AS Half_Day,
        COUNT(CASE WHEN a.status = 'L' THEN 1 END) AS Leave_Days,
        CONCAT(COALESCE(ROUND((COUNT(CASE WHEN a.status = 'P' THEN 1 END) + (COUNT(CASE WHEN a.status = 'HD' THEN 1 END) * 0.5)) / NULLIF(COUNT(a.id), 0) * 100, 2), 0), '%') AS Percentage
      FROM students s 
      LEFT JOIN profiles p ON p.student_id = s.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= ? AND a.date <= ?
      WHERE s.role = 'student' OR s.role IS NULL
      GROUP BY s.id, s.name, p.course
      ORDER BY s.id DESC
    `, [fromDate, toDate]);
    return sendPDFResponse(res, `Attendance Report Summary (${fromDate} to ${toDate})`, rows);
  } catch (error) {
    console.error("[REPORTS /attendance/pdf ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
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
        COALESCE(pr.course, 'Information Technology') AS Department,
        COALESCE(p.subject_name, 'No subjects recorded') AS Subject,
        CONCAT(COALESCE(p.marks_obtained, 0), '/', COALESCE(p.total_marks, 100)) AS Marks,
        COALESCE(p.grade, 'N/A') AS Grade
      FROM students s
      LEFT JOIN profiles pr ON pr.student_id = s.id
      LEFT JOIN performance p ON s.id = p.student_id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendCSVResponse(res, "Performance_Report", rows);
  } catch (error) {
    console.error("[REPORTS /performance/excel ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

router.get("/performance/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Student_Name, 
        COALESCE(pr.course, 'Information Technology') AS Department,
        COALESCE(p.subject_name, 'No subjects recorded') AS Subject,
        CONCAT(COALESCE(p.marks_obtained, 0), '/', COALESCE(p.total_marks, 100)) AS Marks,
        COALESCE(p.grade, 'N/A') AS Grade
      FROM students s
      LEFT JOIN profiles pr ON pr.student_id = s.id
      LEFT JOIN performance p ON s.id = p.student_id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendPDFResponse(res, "Academic Performance Report", rows);
  } catch (error) {
    console.error("[REPORTS /performance/pdf ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

// ---------------------------------------------------------
// 4. COMPLETE COLLEGE REPORT
// ---------------------------------------------------------
router.get("/excel", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Name, 
        s.email AS Email, 
        COALESCE(p.course, 'Information Technology') AS Department, 
        s.created_at AS Registered_Date 
      FROM students s
      LEFT JOIN profiles p ON p.student_id = s.id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendCSVResponse(res, "Complete_College_Report", rows);
  } catch (error) {
    console.error("[REPORTS /excel ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

router.get("/pdf", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT('STU-', LPAD(s.id, 4, '0')) AS Student_ID, 
        s.name AS Name, 
        s.email AS Email, 
        COALESCE(p.course, 'Information Technology') AS Department, 
        s.created_at AS Registered_Date 
      FROM students s
      LEFT JOIN profiles p ON p.student_id = s.id
      WHERE s.role = 'student' OR s.role IS NULL
      ORDER BY s.id DESC
    `);
    return sendPDFResponse(res, "Complete College Directory Report", rows);
  } catch (error) {
    console.error("[REPORTS /pdf ERROR]:", error);
    return res.status(500).send(`Database Query Error: ${error.message}`);
  }
});

module.exports = router;