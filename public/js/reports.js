"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =========================================================
// DATE RANGE
// =========================================================

function getStartDateForRange(range, customStart) {
  if (range === "custom" && customStart) {
    return customStart;
  }

  const d = new Date();

  if (range === "1m") {
    d.setMonth(d.getMonth() - 1);
  } else if (range === "3m") {
    d.setMonth(d.getMonth() - 3);
  } else if (range === "6m") {
    d.setMonth(d.getMonth() - 6);
  } else if (range === "1y") {
    d.setFullYear(d.getFullYear() - 1);
  } else {
    d.setMonth(d.getMonth() - 1);
  }

  return d.toISOString().slice(0, 10);
}

// =========================================================
// ALL STUDENTS QUERY
// =========================================================
// This combines:
//
// 1. Students from users table where role = student
// 2. Students from students table that are NOT already
//    present in users using their email.
//
// This prevents duplicate students while ensuring
// newly registered students are included.
// =========================================================

const ALL_STUDENTS_QUERY = `
  SELECT
    u.id,
    u.name,
    u.email,
    COALESCE(u.department, u.course, 'General') AS department
  FROM users u
  WHERE u.role = 'student'

  UNION ALL

  SELECT
    s.id,
    s.name,
    s.email,
    COALESCE(s.department, s.course, 'General') AS department
  FROM students s
  WHERE NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.role = 'student'
      AND LOWER(TRIM(u.email)) = LOWER(TRIM(s.email))
  )
`;

// =========================================================
// CSV CONVERTER
// =========================================================

function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return "\uFEFFNo records found\n";
  }

  const headers = Object.keys(data[0]);

  const csvRows = [];

  csvRows.push(
    headers
      .map((header) => `"${String(header).replace(/"/g, '""')}"`)
      .join(",")
  );

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] ?? "";

      return `"${String(value).replace(/"/g, '""')}"`;
    });

    csvRows.push(values.join(","));
  }

  // BOM makes Excel correctly recognize UTF-8
  return "\uFEFF" + csvRows.join("\n");
}

// =========================================================
// SEND CSV / EXCEL RESPONSE
// =========================================================

function sendCSVResponse(res, filename, rows) {
  const csvData = convertToCSV(rows);

  res.setHeader(
    "Content-Type",
    "text/csv; charset=utf-8"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(csvData);
}

// =========================================================
// HTML ESCAPE FOR PDF
// =========================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================================
// SEND PDF / PRINT RESPONSE
// =========================================================

function sendPDFResponse(res, title, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    rows = [
      {
        Status: "No records found for the selected period."
      }
    ];
  }

  const headers = Object.keys(rows[0]);

  const html = `
<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8">

<title>${escapeHTML(title)}</title>

<style>

@page {
  size: A4;
  margin: 15mm;
}

body {
  font-family: Arial, sans-serif;
  margin: 20px;
  color: #1e293b;
}

h1 {
  color: #ff2a75;
  margin-bottom: 5px;
  font-size: 24px;
}

p {
  color: #64748b;
  font-size: 13px;
  margin-top: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #cbd5e1;
  padding: 8px;
  text-align: left;
  font-size: 11px;
}

th {
  background-color: #f8fafc;
  font-weight: bold;
  color: #0f172a;
}

tr:nth-child(even) {
  background-color: #f8fafc;
}

.footer {
  margin-top: 20px;
  font-size: 11px;
  color: #64748b;
}

</style>

</head>

<body onload="window.print()">

<h1>${escapeHTML(title)}</h1>

<p>
Generated on ${new Date().toLocaleDateString("en-IN")}
</p>

<table>

<thead>

<tr>

${headers
  .map(
    (h) =>
      `<th>${escapeHTML(h.toUpperCase())}</th>`
  )
  .join("")}

</tr>

</thead>

<tbody>

${rows
  .map(
    (row) => `
<tr>

${headers
  .map(
    (h) =>
      `<td>${escapeHTML(row[h] ?? "—")}</td>`
  )
  .join("")}

</tr>
`
  )
  .join("")}

</tbody>

</table>

<div class="footer">
Student Performance & Career Guidance System
</div>

</body>
</html>
`;

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(html);
}

// =========================================================
// 1. ALL STUDENTS REPORT
// =========================================================

// ---------------------------------------------------------
// STUDENTS PDF
// ---------------------------------------------------------

router.get("/students/pdf", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID,
        name AS NAME,
        email AS EMAIL,
        department AS DEPARTMENT
      FROM (
        ${ALL_STUDENTS_QUERY}
      ) AS all_students

      ORDER BY id DESC
    `);

    console.log(
      `📄 Student PDF report: ${rows.length} students`
    );

    return sendPDFResponse(
      res,
      "All Student Profiles Directory",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Student PDF error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// STUDENTS EXCEL
// ---------------------------------------------------------

router.get("/students/excel", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        CONCAT('STU-', LPAD(id, 4, '0')) AS STUDENT_ID,
        name AS NAME,
        email AS EMAIL,
        department AS DEPARTMENT
      FROM (
        ${ALL_STUDENTS_QUERY}
      ) AS all_students

      ORDER BY id DESC
    `);

    console.log(
      `📊 Student Excel report: ${rows.length} students`
    );

    return sendCSVResponse(
      res,
      "All_Students_Report",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Student Excel error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// =========================================================
// 2. ATTENDANCE REPORT
// =========================================================

// ---------------------------------------------------------
// ATTENDANCE EXCEL
// ---------------------------------------------------------

router.get("/attendance/excel", async (req, res) => {

  const {
    range,
    startDate,
    endDate
  } = req.query;

  const fromDate =
    getStartDateForRange(
      range,
      startDate
    );

  const toDate =
    endDate ||
    new Date()
      .toISOString()
      .slice(0, 10);

  try {

    const [rows] = await db.query(
      `
      SELECT

        CONCAT(
          'STU-',
          LPAD(s.id, 4, '0')
        ) AS Student_ID,

        s.name AS Student_Name,

        s.department AS Department,

        COUNT(
          CASE
            WHEN a.status IN ('P', 'present')
            THEN 1
          END
        ) AS Total_Present,

        COUNT(
          CASE
            WHEN a.status IN ('A', 'absent')
            THEN 1
          END
        ) AS Total_Absent,

        COUNT(
          CASE
            WHEN a.status = 'HD'
            THEN 1
          END
        ) AS Total_Half_Day,

        COUNT(
          CASE
            WHEN a.status = 'L'
            THEN 1
          END
        ) AS Total_Leave

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) s

      LEFT JOIN attendance a
        ON s.id = a.student_id
        AND a.date >= ?
        AND a.date <= ?

      GROUP BY
        s.id,
        s.name,
        s.email,
        s.department

      ORDER BY s.id DESC
      `,
      [
        fromDate,
        toDate
      ]
    );

    console.log(
      `📊 Attendance Excel: ${rows.length} students`
    );

    return sendCSVResponse(
      res,
      `Attendance_Report_${range || "all"}`,
      rows
    );

  } catch (err) {

    console.error(
      "❌ Attendance Excel error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// ATTENDANCE PDF
// ---------------------------------------------------------

router.get("/attendance/pdf", async (req, res) => {

  const {
    range,
    startDate,
    endDate
  } = req.query;

  const fromDate =
    getStartDateForRange(
      range,
      startDate
    );

  const toDate =
    endDate ||
    new Date()
      .toISOString()
      .slice(0, 10);

  try {

    const [rows] = await db.query(
      `
      SELECT

        CONCAT(
          'STU-',
          LPAD(s.id, 4, '0')
        ) AS Student_ID,

        s.name AS Student_Name,

        s.department AS Department,

        COUNT(
          CASE
            WHEN a.status IN ('P', 'present')
            THEN 1
          END
        ) AS Present,

        COUNT(
          CASE
            WHEN a.status IN ('A', 'absent')
            THEN 1
          END
        ) AS Absent,

        COUNT(
          CASE
            WHEN a.status = 'HD'
            THEN 1
          END
        ) AS Half_Day,

        COUNT(
          CASE
            WHEN a.status = 'L'
            THEN 1
          END
        ) AS Leave_Days

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) s

      LEFT JOIN attendance a
        ON s.id = a.student_id
        AND a.date >= ?
        AND a.date <= ?

      GROUP BY
        s.id,
        s.name,
        s.email,
        s.department

      ORDER BY s.id DESC
      `,
      [
        fromDate,
        toDate
      ]
    );

    console.log(
      `📄 Attendance PDF: ${rows.length} students`
    );

    return sendPDFResponse(
      res,
      `Attendance Report (${fromDate} to ${toDate})`,
      rows
    );

  } catch (err) {

    console.error(
      "❌ Attendance PDF error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// =========================================================
// 3. PERFORMANCE REPORT
// =========================================================

// ---------------------------------------------------------
// PERFORMANCE EXCEL
// ---------------------------------------------------------

router.get("/performance/excel", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT

        CONCAT(
          'STU-',
          LPAD(s.id, 4, '0')
        ) AS Student_ID,

        s.name AS Student_Name,

        s.department AS Department,

        COALESCE(
          p.subject_name,
          'General Assessment'
        ) AS Subject,

        CONCAT(
          COALESCE(p.marks_obtained, 0),
          '/',
          COALESCE(
            p.total_marks,
            p.max_marks,
            100
          )
        ) AS Marks,

        COALESCE(
          p.grade,
          'N/A'
        ) AS Grade

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) s

      LEFT JOIN performance p
        ON s.id = p.student_id

      ORDER BY s.id DESC
    `);

    console.log(
      `📊 Performance Excel: ${rows.length} records`
    );

    return sendCSVResponse(
      res,
      "Performance_Report",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Performance Excel error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// PERFORMANCE PDF
// ---------------------------------------------------------

router.get("/performance/pdf", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT

        CONCAT(
          'STU-',
          LPAD(s.id, 4, '0')
        ) AS Student_ID,

        s.name AS Student_Name,

        s.department AS Department,

        COALESCE(
          p.subject_name,
          'General Assessment'
        ) AS Subject,

        CONCAT(
          COALESCE(p.marks_obtained, 0),
          '/',
          COALESCE(
            p.total_marks,
            p.max_marks,
            100
          )
        ) AS Marks,

        COALESCE(
          p.grade,
          'N/A'
        ) AS Grade

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) s

      LEFT JOIN performance p
        ON s.id = p.student_id

      ORDER BY s.id DESC
    `);

    console.log(
      `📄 Performance PDF: ${rows.length} records`
    );

    return sendPDFResponse(
      res,
      "Academic Performance Report",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Performance PDF error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// =========================================================
// 4. COMPLETE COLLEGE DIRECTORY
// =========================================================

// ---------------------------------------------------------
// COMPLETE PDF
// ---------------------------------------------------------

router.get("/pdf", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT

        CONCAT(
          'STU-',
          LPAD(id, 4, '0')
        ) AS ID,

        name AS NAME,

        email AS EMAIL,

        department AS DEPARTMENT

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) AS all_students

      ORDER BY id DESC
    `);

    console.log(
      `📄 Complete PDF: ${rows.length} students`
    );

    return sendPDFResponse(
      res,
      "Complete College Directory Report",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Complete PDF error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// ---------------------------------------------------------
// COMPLETE EXCEL
// ---------------------------------------------------------

router.get("/excel", async (req, res) => {

  try {

    const [rows] = await db.query(`
      SELECT

        CONCAT(
          'STU-',
          LPAD(id, 4, '0')
        ) AS ID,

        name AS NAME,

        email AS EMAIL,

        department AS DEPARTMENT

      FROM (
        ${ALL_STUDENTS_QUERY}
      ) AS all_students

      ORDER BY id DESC
    `);

    console.log(
      `📊 Complete Excel: ${rows.length} students`
    );

    return sendCSVResponse(
      res,
      "Complete_College_Report",
      rows
    );

  } catch (err) {

    console.error(
      "❌ Complete Excel error:",
      err
    );

    return res
      .status(500)
      .send("Database Error: " + err.message);
  }
});

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;