"use strict";

const db = require("../config/db");

// =====================================================
// HELPER
// =====================================================

function numberOrDefault(value, defaultValue) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? number
        : defaultValue;
}

function obtainedMarks(value, max) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return 0;
    }

    return Math.min(number, max);
}

function normalizeStatus(status) {
    return String(status || "active").toLowerCase() === "inactive"
        ? "inactive"
        : "active";
}


// =====================================================
// GET ALL SUBJECTS
// GET /api/subjects
// =====================================================

const getSubjects = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                name,
                category,
                theory_obt,
                theory_max,
                assignment_obt,
                assignment_max,
                practical_obt,
                practical_max,
                code,
                semester,
                department,
                credits,
                status,
                description,
                created_at
            FROM subjects
            ORDER BY id DESC
        `);

        return res.status(200).json({
            success: true,
            subjects: rows
        });

    } catch (error) {
        console.error("❌ Get subjects error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch subjects",
            error: error.message
        });
    }
};


// =====================================================
// GET SUBJECT BY ID
// GET /api/subjects/:id
// =====================================================

const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                id,
                name,
                category,
                theory_obt,
                theory_max,
                assignment_obt,
                assignment_max,
                practical_obt,
                practical_max,
                code,
                semester,
                department,
                credits,
                status,
                description,
                created_at
            FROM subjects
            WHERE id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        return res.status(200).json({
            success: true,
            subject: rows[0]
        });

    } catch (error) {
        console.error("❌ Get subject error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch subject",
            error: error.message
        });
    }
};


// =====================================================
// ADD SUBJECT
// POST /api/subjects
// =====================================================

const addSubject = async (req, res) => {
    try {
        const {
            name,
            category,
            theory_obt,
            theory_max,
            assignment_obt,
            assignment_max,
            practical_obt,
            practical_max,
            code,
            semester,
            department,
            credits,
            status,
            description
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });
        }

        if (!code || !String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject code is required"
            });
        }

        if (
            semester === undefined ||
            semester === null ||
            semester === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester is required"
            });
        }

        if (!department || !String(department).trim()) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        const normalizedCode =
            String(code).trim().toUpperCase();

        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 6
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 6"
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE CODE
        // ---------------------------------------------

        const [existing] = await db.query(
            `
            SELECT id
            FROM subjects
            WHERE code = ?
            `,
            [normalizedCode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        // ---------------------------------------------
        // MARKS
        // ---------------------------------------------

        const theoryMax =
            numberOrDefault(theory_max, 100);

        const assignmentMax =
            numberOrDefault(assignment_max, 25);

        const practicalMax =
            numberOrDefault(practical_max, 50);

        const theoryObt =
            obtainedMarks(theory_obt, theoryMax);

        const assignmentObt =
            obtainedMarks(assignment_obt, assignmentMax);

        const practicalObt =
            obtainedMarks(practical_obt, practicalMax);

        // ---------------------------------------------
        // OTHER DATA
        // ---------------------------------------------

        const subjectCategory =
            category || "Core";

        const subjectStatus =
            normalizeStatus(status);

        const subjectCredits =
            Number.isFinite(Number(credits)) &&
            Number(credits) >= 0
                ? Number(credits)
                : 0;

        const subjectDescription =
            description &&
            String(description).trim()
                ? String(description).trim()
                : null;

        // ---------------------------------------------
        // INSERT
        // ---------------------------------------------

        const [result] = await db.query(
            `
            INSERT INTO subjects
            (
                name,
                category,
                theory_obt,
                theory_max,
                assignment_obt,
                assignment_max,
                practical_obt,
                practical_max,
                code,
                semester,
                department,
                credits,
                status,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                String(name).trim(),
                subjectCategory,

                theoryObt,
                theoryMax,

                assignmentObt,
                assignmentMax,

                practicalObt,
                practicalMax,

                normalizedCode,
                semesterNumber,

                String(department).trim(),

                subjectCredits,
                subjectStatus,
                subjectDescription
            ]
        );

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Subject added successfully",
            subjectId: result.insertId
        });

    } catch (error) {
        console.error("❌ Add subject error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add subject",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE SUBJECT
// PUT /api/subjects/:id
// =====================================================

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            category,
            theory_obt,
            theory_max,
            assignment_obt,
            assignment_max,
            practical_obt,
            practical_max,
            code,
            semester,
            department,
            credits,
            status,
            description
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });
        }

        if (!code || !String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject code is required"
            });
        }

        if (
            semester === undefined ||
            semester === null ||
            semester === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester is required"
            });
        }

        if (!department || !String(department).trim()) {
            return res.status(400).json({
                success: false,
                message: "Department is required"
            });
        }

        const semesterNumber = Number(semester);

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 6
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester must be between 1 and 6"
            });
        }

        const normalizedCode =
            String(code).trim().toUpperCase();

        // ---------------------------------------------
        // CHECK SUBJECT
        // ---------------------------------------------

        const [subjectRows] = await db.query(
            `
            SELECT id
            FROM subjects
            WHERE id = ?
            `,
            [id]
        );

        if (subjectRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE CODE
        // ---------------------------------------------

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM subjects
            WHERE code = ?
            AND id <> ?
            `,
            [
                normalizedCode,
                id
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another subject already uses this code"
            });
        }

        // ---------------------------------------------
        // MARKS
        // ---------------------------------------------

        const theoryMax =
            numberOrDefault(theory_max, 100);

        const assignmentMax =
            numberOrDefault(assignment_max, 25);

        const practicalMax =
            numberOrDefault(practical_max, 50);

        const theoryObt =
            obtainedMarks(theory_obt, theoryMax);

        const assignmentObt =
            obtainedMarks(assignment_obt, assignmentMax);

        const practicalObt =
            obtainedMarks(practical_obt, practicalMax);

        // ---------------------------------------------
        // OTHER DATA
        // ---------------------------------------------

        const subjectCategory =
            category || "Core";

        const subjectStatus =
            normalizeStatus(status);

        const subjectCredits =
            Number.isFinite(Number(credits)) &&
            Number(credits) >= 0
                ? Number(credits)
                : 0;

        const subjectDescription =
            description &&
            String(description).trim()
                ? String(description).trim()
                : null;

        // ---------------------------------------------
        // UPDATE
        // ---------------------------------------------

        const [result] = await db.query(
            `
            UPDATE subjects
            SET
                name = ?,
                category = ?,
                theory_obt = ?,
                theory_max = ?,
                assignment_obt = ?,
                assignment_max = ?,
                practical_obt = ?,
                practical_max = ?,
                code = ?,
                semester = ?,
                department = ?,
                credits = ?,
                status = ?,
                description = ?
            WHERE id = ?
            `,
            [
                String(name).trim(),
                subjectCategory,

                theoryObt,
                theoryMax,

                assignmentObt,
                assignmentMax,

                practicalObt,
                practicalMax,

                normalizedCode,
                semesterNumber,

                String(department).trim(),

                subjectCredits,
                subjectStatus,
                subjectDescription,

                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully"
        });

    } catch (error) {
        console.error("❌ Update subject error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update subject",
            error: error.message
        });
    }
};


// =====================================================
// DELETE SUBJECT
// DELETE /api/subjects/:id
// =====================================================

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            DELETE FROM subjects
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error("❌ Delete subject error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete subject",
            error: error.message
        });
    }
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    getSubjects,
    getSubjectById,
    addSubject,
    updateSubject,
    deleteSubject
};