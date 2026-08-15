"use strict";

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =========================================================
// ATTENDANCE TABLE INITIALIZATION
// =========================================================

async function initTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,

        student_id INT NOT NULL,

        date DATE NOT NULL,

        status ENUM('P', 'A', 'L') NOT NULL DEFAULT 'A',

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        UNIQUE KEY unique_student_date (student_id, date),

        INDEX idx_attendance_student (student_id),
        INDEX idx_attendance_date (date)

      ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Attendance table ready");
  } catch (error) {
    console.error(
      "[ATTENDANCE TABLE INIT ERROR]:",
      error.message
    );
  }
}

initTable();


// =========================================================
// HELPER FUNCTIONS
// =========================================================

// Validate year/month
function validateYearMonth(year, month) {

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    return false;
  }

  // Attendance starts from January 2026
  if (year < 2026) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  return true;
}


// Get number of days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}


// Format date as YYYY-MM-DD
function formatDate(year, month, day) {

  return (
    `${year}-` +
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`
  );
}


// Validate attendance status
function isValidStatus(status) {

  return ["P", "A", "L"].includes(status);
}


// =========================================================
// GET ATTENDANCE
//
// GET /api/attendance?year=2026&month=1
//
// Default:
// January 2026
// =========================================================

router.get("/", async (req, res) => {

  try {

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");


    // -----------------------------------------------------
    // YEAR & MONTH
    // -----------------------------------------------------

    const year = Number(req.query.year) || 2026;
    const month = Number(req.query.month) || 1;


    // Attendance cannot go before January 2026

    if (!validateYearMonth(year, month)) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid year/month. Attendance starts from January 2026."
      });

    }


    // -----------------------------------------------------
    // DATE RANGE
    // -----------------------------------------------------

    const daysInMonth =
      getDaysInMonth(year, month);

    const startDate =
      formatDate(year, month, 1);

    const endDate =
      formatDate(year, month, daysInMonth);


    // -----------------------------------------------------
    // GET ALL STUDENTS
    // -----------------------------------------------------

    const [students] = await db.query(`

      SELECT

        s.id,

        CONCAT(
          'STU-',
          LPAD(s.id, 4, '0')
        ) AS studentCode,

        s.name,

        s.email,

        COALESCE(
          p.course,
          'Information Technology'
        ) AS department

      FROM students s

      LEFT JOIN profiles p
        ON p.student_id = s.id

      WHERE
        s.role = 'student'
        OR s.role IS NULL

      ORDER BY s.id ASC

    `);


    // -----------------------------------------------------
    // GET EXISTING ATTENDANCE
    // -----------------------------------------------------

    const [records] = await db.query(

      `

      SELECT

        student_id,

        DATE_FORMAT(
          date,
          '%Y-%m-%d'
        ) AS date,

        status

      FROM attendance

      WHERE date BETWEEN ? AND ?

      ORDER BY date ASC

      `,

      [
        startDate,
        endDate
      ]

    );


    // -----------------------------------------------------
    // BUILD ATTENDANCE MAP
    //
    // Example:
    //
    // {
    //   "1_2026-01-01": "A",
    //   "1_2026-01-02": "P",
    //   "2_2026-01-01": "L"
    // }
    // -----------------------------------------------------

    const attendanceMap = {};


    for (const record of records) {

      attendanceMap[
        `${record.student_id}_${record.date}`
      ] = record.status;

    }


    // -----------------------------------------------------
    // DEFAULT VALUES
    //
    // If no attendance record exists in SQL,
    // return "A" = Absent.
    //
    // We DO NOT automatically insert thousands of
    // records into SQL here.
    //
    // SQL receives a record when admin saves/marks
    // attendance.
    // -----------------------------------------------------

    for (const student of students) {

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {

        const date =
          formatDate(year, month, day);

        const key =
          `${student.id}_${date}`;


        if (!attendanceMap[key]) {

          attendanceMap[key] = "A";

        }

      }

    }


    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({

      success: true,

      year,

      month,

      startDate,

      endDate,

      daysInMonth,

      students,

      attendance: attendanceMap

    });

  } catch (error) {

    console.error(
      "[ATTENDANCE GET ERROR]:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to load attendance.",

      error:
        error.message

    });

  }

});


// =========================================================
// POST /api/attendance
//
// Save / update attendance for one student and one date
//
// Allowed:
//
// P = Present
// A = Absent
// L = Leave
// =========================================================

router.post("/", async (req, res) => {

  try {

    const {
      student_id,
      date,
      status
    } = req.body;


    // -----------------------------------------------------
    // REQUIRED FIELDS
    // -----------------------------------------------------

    if (
      !student_id ||
      !date ||
      !status
    ) {

      return res.status(400).json({

        success: false,

        message:
          "student_id, date and status are required."

      });

    }


    // -----------------------------------------------------
    // STATUS VALIDATION
    // -----------------------------------------------------

    if (!isValidStatus(status)) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid status. Only P, A or L are allowed."

      });

    }


    // -----------------------------------------------------
    // STUDENT ID VALIDATION
    // -----------------------------------------------------

    const studentId =
      Number(student_id);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid student ID."

      });

    }


    // -----------------------------------------------------
    // DATE VALIDATION
    // -----------------------------------------------------

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid date. Use YYYY-MM-DD."

      });

    }


    // -----------------------------------------------------
    // ATTENDANCE START DATE
    // -----------------------------------------------------

    const minimumDate =
      "2026-01-01";


    if (date < minimumDate) {

      return res.status(400).json({

        success: false,

        message:
          "Attendance can only be recorded from January 2026."

      });

    }


    // -----------------------------------------------------
    // CHECK STUDENT EXISTS
    // -----------------------------------------------------

    const [studentRows] = await db.query(

      `

      SELECT id

      FROM students

      WHERE id = ?

      LIMIT 1

      `,

      [studentId]

    );


    if (studentRows.length === 0) {

      return res.status(404).json({

        success: false,

        message:
          "Student not found."

      });

    }


    // -----------------------------------------------------
    // INSERT OR UPDATE
    //
    // If record does not exist:
    // INSERT
    //
    // If record already exists:
    // UPDATE
    // -----------------------------------------------------

    await db.query(

      `

      INSERT INTO attendance
      (
        student_id,
        date,
        status
      )

      VALUES
      (
        ?,
        ?,
        ?
      )

      ON DUPLICATE KEY UPDATE

        status = VALUES(status),

        updated_at = CURRENT_TIMESTAMP

      `,

      [
        studentId,
        date,
        status
      ]

    );


    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({

      success: true,

      message:
        "Attendance saved successfully.",

      data: {

        student_id: studentId,

        date,

        status

      }

    });

  } catch (error) {

    console.error(
      "[ATTENDANCE SAVE ERROR]:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to save attendance.",

      error:
        error.message

    });

  }

});


// =========================================================
// DELETE ATTENDANCE
//
// Optional endpoint if admin wants to reset a date.
//
// DELETE /api/attendance/:student_id/:date
//
// After deletion, frontend will show default A.
// =========================================================

router.delete(
  "/:student_id/:date",
  async (req, res) => {

    try {

      const studentId =
        Number(req.params.student_id);

      const date =
        req.params.date;


      if (
        !Number.isInteger(studentId) ||
        studentId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid student ID."

        });

      }


      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid date."

        });

      }


      await db.query(

        `

        DELETE FROM attendance

        WHERE
          student_id = ?
          AND date = ?

        `,

        [
          studentId,
          date
        ]

      );


      return res.status(200).json({

        success: true,

        message:
          "Attendance reset successfully."

      });

    } catch (error) {

      console.error(
        "[ATTENDANCE DELETE ERROR]:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to reset attendance.",

        error:
          error.message

      });

    }

  }
);


module.exports = router;