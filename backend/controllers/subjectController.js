
"use strict";

const db = require("../config/db");

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

        res.status(200).json({
            success: true,
            subjects: rows
        });

    } catch (error) {

        console.error("❌ Get subjects error:", error);

        res.status(500).json({
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


        res.status(200).json({
            success: true,
            subject: rows[0]
        });


    } catch (error) {

        console.error("❌ Get subject error:", error);

        res.status(500).json({
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


        // -------------------------------------------------
        // REQUIRED FIELD VALIDATION
        // -------------------------------------------------

        if (!name || !name.trim()) {

            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });

        }


        if (!code || !code.trim()) {

            return res.status(400).json({
                success: false,
                message: "Subject code is required"
            });

        }


        if (!semester) {

            return res.status(400).json({
                success: false,
                message: "Semester is required"
            });

        }


        if (!department || !department.trim()) {

            return res.status(400).json({
                success: false,
                message: "Department is required"
            });

        }


        // -------------------------------------------------
        // CHECK DUPLICATE SUBJECT CODE
        // -------------------------------------------------

        const [existing] = await db.query(
            `
                SELECT id
                FROM subjects
                WHERE code = ?
            `,
            [code.trim().toUpperCase()]
        );


        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });

        }


        // -------------------------------------------------
        // MARKS
        // -------------------------------------------------

        const tMax =
            Number(theory_max) > 0
                ? Number(theory_max)
                : 100;


        const aMax =
            Number(assignment_max) > 0
                ? Number(assignment_max)
                : 25;


        const pMax =
            Number(practical_max) > 0
                ? Number(practical_max)
                : 50;


        const tObt =
            Math.min(
                Math.max(
                    Number(theory_obt) || 0,
                    0
                ),
                tMax
            );


        const aObt =
            Math.min(
                Math.max(
                    Number(assignment_obt) || 0,
                    0
                ),
                aMax
            );


        const pObt =
            Math.min(
                Math.max(
                    Number(practical_obt) || 0,
                    0
                ),
                pMax
            );


        // -------------------------------------------------
        // OTHER VALUES
        // -------------------------------------------------

        const subjectCategory =
            category || "Core";


        const subjectStatus =
            status === "inactive"
                ? "inactive"
                : "active";


        const subjectCredits =
            Number(credits) >= 0
                ? Number(credits)
                : 0;


        // -------------------------------------------------
        // INSERT
        // -------------------------------------------------

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
                VALUES
                (
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?
                )
            `,
            [
                name.trim(),

                subjectCategory,

                tObt,
                tMax,

                aObt,
                aMax,

                pObt,
                pMax,

                code.trim().toUpperCase(),

                Number(semester),

                department.trim(),

                subjectCredits,

                subjectStatus,

                description
                    ? description.trim()
                    : null
            ]
        );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        res.status(201).json({
            success: true,
            message: "Subject added successfully",
            subjectId: result.insertId
        });


    } catch (error) {

        console.error("❌ Add subject error:", error);


        // MySQL duplicate key safety
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });

        }


        res.status(500).json({
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


        // -------------------------------------------------
        // REQUIRED FIELD VALIDATION
        // -------------------------------------------------

        if (!name || !name.trim()) {

            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            });

        }


        if (!code || !code.trim()) {

            return res.status(400).json({
                success: false,
                message: "Subject code is required"
            });

        }


        if (!semester) {

            return res.status(400).json({
                success: false,
                message: "Semester is required"
            });

        }


        if (!department || !department.trim()) {

            return res.status(400).json({
                success: false,
                message: "Department is required"
            });

        }


        // -------------------------------------------------
        // CHECK SUBJECT EXISTS
        // -------------------------------------------------

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


        // -------------------------------------------------
        // CHECK DUPLICATE CODE
        // -------------------------------------------------

        const normalizedCode =
            code.trim().toUpperCase();


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


        // -------------------------------------------------
        // MARKS
        // -------------------------------------------------

        const tMax =
            Number(theory_max) > 0
                ? Number(theory_max)
                : 100;


        const aMax =
            Number(assignment_max) > 0
                ? Number(assignment_max)
                : 25;


        const pMax =
            Number(practical_max) > 0
                ? Number(practical_max)
                : 50;


        const tObt =
            Math.min(
                Math.max(
                    Number(theory_obt) || 0,
                    0
                ),
                tMax
            );


        const aObt =
            Math.min(
                Math.max(
                    Number(assignment_obt) || 0,
                    0
                ),
                aMax
            );


        const pObt =
            Math.min(
                Math.max(
                    Number(practical_obt) || 0,
                    0
                ),
                pMax
            );


        // -------------------------------------------------
        // OTHER VALUES
        // -------------------------------------------------

        const subjectCategory =
            category || "Core";


        const subjectStatus =
            status === "inactive"
                ? "inactive"
                : "active";


        const subjectCredits =
            Number(credits) >= 0
                ? Number(credits)
                : 0;


        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

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
                name.trim(),

                subjectCategory,

                tObt,
                tMax,

                aObt,
                aMax,

                pObt,
                pMax,

                normalizedCode,

                Number(semester),

                department.trim(),

                subjectCredits,

                subjectStatus,

                description
                    ? description.trim()
                    : null,

                id
            ]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Subject not found"
            });

        }


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        res.status(200).json({
            success: true,
            message: "Subject updated successfully"
        });


    } catch (error) {

        console.error(
            "❌ Update subject error:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Subject code already exists"
            });

        }


        res.status(500).json({
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


        res.status(200).json({
            success: true,
            message: "Subject deleted successfully"
        });


    } catch (error) {

        console.error(
            "❌ Delete subject error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to delete subject",
            error: error.message
        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getSubjects,

    getSubjectById,

    addSubject,

    updateSubject,

    deleteSubject

};
