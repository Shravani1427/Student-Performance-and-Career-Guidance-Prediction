"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// =====================================================
// REGISTER STUDENT
// POST /api/auth/register
// =====================================================

const register = async (req, res) => {
    let connection = null;

    try {
        console.log("");
        console.log("============================================");
        console.log("📝 REGISTRATION REQUEST");
        console.log("============================================");

        const {
            name,
            email,
            password,
            phone,
            course,
            semester
        } = req.body;

        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Phone:", phone);
        console.log("Course:", course);
        console.log("Semester:", semester);

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !name ||
            !email ||
            !password ||
            !phone ||
            !course ||
            !semester
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = String(phone).trim();
        const cleanCourse = String(course).trim();
        const cleanSemester = Number(semester);

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid name."
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        if (
            !Number.isInteger(cleanSemester) ||
            cleanSemester < 1 ||
            cleanSemester > 6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Semester must be between 1 and 6."
            });
        }

        // ---------------------------------------------
        // DATABASE CONNECTION
        // ---------------------------------------------

        connection = await db.getConnection();

        await connection.beginTransaction();

        // ---------------------------------------------
        // CHECK EXISTING EMAIL
        // ---------------------------------------------

        const [existingUsers] =
            await connection.execute(
                `SELECT id
                 FROM students
                 WHERE email = ?
                 LIMIT 1`,
                [cleanEmail]
            );

        if (existingUsers.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        // ---------------------------------------------
        // HASH PASSWORD
        // ---------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // ---------------------------------------------
        // INSERT STUDENT
        // ---------------------------------------------

        const [studentResult] =
            await connection.execute(
                `INSERT INTO students
                (
                    name,
                    email,
                    password,
                    phone,
                    role
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    cleanName,
                    cleanEmail,
                    hashedPassword,
                    cleanPhone,
                    "student"
                ]
            );

        const studentId =
            studentResult.insertId;

        // ---------------------------------------------
        // INSERT PROFILE
        // ---------------------------------------------

        await connection.execute(
            `INSERT INTO profiles
            (
                student_id,
                course,
                semester
            )
            VALUES (?, ?, ?)`,
            [
                studentId,
                cleanCourse,
                cleanSemester
            ]
        );

        // ---------------------------------------------
        // COMMIT
        // ---------------------------------------------

        await connection.commit();

        // ---------------------------------------------
        // JWT
        // ---------------------------------------------

        const token =
            jwt.sign(
                {
                    id: studentId,
                    email: cleanEmail,
                    role: "student"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h"
                }
            );

        console.log(
            "✅ Registration successful:",
            cleanEmail
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            token: token,

            user: {
                id: studentId,
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                course: cleanCourse,
                semester: cleanSemester,
                role: "student"
            }
        });

    } catch (error) {

        console.error("");
        console.error("❌ REGISTRATION ERROR");
        console.error(error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError.message
                );
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });
        }

        if (error.code === "ER_NO_SUCH_TABLE") {
            return res.status(500).json({
                success: false,
                message:
                    "Required database table does not exist."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Registration failed. Please try again."
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// COMMON LOGIN FUNCTION
// POST /api/auth/login
// =====================================================

const login = async (req, res) => {

    try {

        console.log("");
        console.log("============================================");
        console.log("🔐 LOGIN REQUEST");
        console.log("============================================");

        const {
            email,
            password,
            role
        } = req.body;

        console.log("Email:", email);
        console.log("Requested role:", role);

        // ---------------------------------------------
        // VALIDATE
        // ---------------------------------------------

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();

        // ---------------------------------------------
        // FIND USER
        // ---------------------------------------------

        const [rows] =
            await db.execute(
                `SELECT
                    id,
                    name,
                    email,
                    password,
                    phone,
                    role
                 FROM students
                 WHERE email = ?
                 LIMIT 1`,
                [cleanEmail]
            );

        if (rows.length === 0) {

            console.log(
                "❌ User not found:",
                cleanEmail
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const user = rows[0];

        console.log(
            "✅ User found:",
            user.email
        );

        console.log(
            "Database role:",
            user.role
        );

        // ---------------------------------------------
        // ROLE CHECK
        // ---------------------------------------------

        if (
            role &&
            String(user.role).toLowerCase() !==
            String(role).toLowerCase()
        ) {

            console.log(
                "❌ Role mismatch."
            );

            return res.status(403).json({
                success: false,
                message:
                    `This account is registered as ${user.role}.`
            });
        }

        // ---------------------------------------------
        // PASSWORD CHECK
        // ---------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            console.log(
                "❌ Incorrect password."
            );

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        console.log(
            "✅ Password verified."
        );

        // ---------------------------------------------
        // PROFILE
        // ---------------------------------------------

        let course = "";
        let semester = "";

        try {

            const [profiles] =
                await db.execute(
                    `SELECT
                        course,
                        semester
                     FROM profiles
                     WHERE student_id = ?
                     LIMIT 1`,
                    [user.id]
                );

            if (profiles.length > 0) {

                course =
                    profiles[0].course || "";

                semester =
                    profiles[0].semester || "";
            }

        } catch (profileError) {

            console.log(
                "⚠️ Profile not found:",
                profileError.message
            );
        }

        // ---------------------------------------------
        // CREATE JWT
        // ---------------------------------------------

        const token =
            jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h"
                }
            );

        console.log(
            "✅ Login successful:",
            user.email
        );

        console.log(
            "Role:",
            user.role
        );

        console.log("============================================");

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token: token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                role: user.role,
                course: course,
                semester: semester
            }
        });

    } catch (error) {

        console.error("");
        console.error("❌ LOGIN ERROR");
        console.error(error);
        console.error("");

        return res.status(500).json({
            success: false,
            message:
                "Server error during login."
        });
    }
};


// =====================================================
// ADMIN LOGIN
// POST /api/auth/admin-login
// =====================================================

const adminLogin = async (req, res) => {

    try {

        console.log("");
        console.log("============================================");
        console.log("🔐 ADMIN LOGIN REQUEST");
        console.log("============================================");

        // Force admin role
        req.body.role = "admin";

        return await login(req, res);

    } catch (error) {

        console.error(
            "❌ ADMIN LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during admin login."
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    adminLogin
};