"use strict";

const db = require("../config/db");
let studentController = {};

try {
  studentController = require("./studentController");
} catch (err) {
  console.warn("[REPORTS] studentController load warning:", err.message);
}

/**
 * Helper: Fetch fallback student info if summary fails or has no grades/attendance yet
 */
async function getFallbackStudentData(studentId) {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, department, roll_no, created_at FROM students WHERE id = ?",
      [studentId]
    );
    if (rows && rows.length > 0) {
      return {
        student: rows[0],
        attendance: { total: 0, present: 0, percentage: 0 },
        performance: [],
        summary: "New student - no performance or attendance records yet."
      };
    }
    return null;
  } catch (error) {
    console.error(`[REPORTS] Error fetching fallback for student ID ${studentId}:`, error);
    return null;
  }
}

/**
 * GET /api/reports/student/:studentId
 */
async function studentReport(request, response) {
  try {
    response.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });

    const studentId = Number(request.params.studentId);

    // Permission check
    if (
      request.user &&
      request.user.role !== "admin" &&
      Number(request.user.id) !== studentId
    ) {
      return response.status(403).json({
        success: false,
        message: "You can only view your own report."
      });
    }

    let report = null;

    if (typeof studentController.getStudentSummary === "function") {
      try {
        report = await studentController.getStudentSummary(studentId);
      } catch (err) {
        console.warn(`[REPORTS] getStudentSummary failed for ID ${studentId}, using fallback:`, err.message);
      }
    }

    // If student has no marks/attendance yet, build basic student profile
    if (!report) {
      report = await getFallbackStudentData(studentId);
    }

    if (!report) {
      return response.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    return response.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("[REPORTS] studentReport error:", error);
    return response.status(500).json({
      success: false,
      message: "Internal server error fetching student report",
      error: error.message
    });
  }
}

/**
 * GET /api/reports / GET /api/reports/all
 */
async function allReports(request, response) {
  try {
    // Disable caching
    response.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });

    // Query all students with role='student' or where role is null/empty
    const [rows] = await db.execute(
      "SELECT id, name, email, department, roll_no FROM students WHERE role = 'student' OR role IS NULL ORDER BY id DESC"
    );

    if (!rows || rows.length === 0) {
      return response.json({
        success: true,
        data: []
      });
    }

    const reports = [];

    for (const row of rows) {
      let report = null;

      if (typeof studentController.getStudentSummary === "function") {
        try {
          report = await studentController.getStudentSummary(row.id);
        } catch (err) {
          console.warn(`[REPORTS] Summary failed for ID ${row.id}:`, err.message);
        }
      }

      // Fallback: If no summary or student is newly added without relations
      if (!report) {
        report = {
          student: row,
          attendance: { total: 0, present: 0, percentage: 0 },
          performance: [],
          summary: "Newly registered student."
        };
      }

      reports.push(report);
    }

    return response.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error("[REPORTS] allReports error:", error);
    return response.status(500).json({
      success: false,
      message: "Internal server error fetching all reports",
      error: error.message
    });
  }
}

module.exports = {
  studentReport,
  allReports
};