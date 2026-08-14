"use strict";

// =====================================================
// SERVER.JS
// Student Performance & Career Guidance System
//
// Backend:
// Node.js + Express.js + MySQL
//
// Deployment:
// Frontend -> Vercel
// Backend  -> Vercel
//
// Backend file:
// /backend/server.js
// =====================================================

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

// backend/.env.local
dotenv.config({
    path: path.join(__dirname, ".env.local")
});

// backend/.env
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    dotenv.config({
        path: path.join(__dirname, ".env")
    });
}

// project-root/.env.local
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    dotenv.config({
        path: path.join(__dirname, "../.env.local")
    });
}

// project-root/.env
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    dotenv.config({
        path: path.join(__dirname, "../.env")
    });
}

// =====================================================
// DATABASE
// =====================================================

const db = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const careerRoutes = require("./routes/careerRoutes");
const reportRoutes = require("./routes/reportRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

// =====================================================
// OPTIONAL ATTENDANCE ROUTES
// =====================================================

const attendanceRoutesPath = path.join(
    __dirname,
    "routes",
    "attendanceRoutes.js"
);

let attendanceRoutes = null;

if (fs.existsSync(attendanceRoutesPath)) {
    attendanceRoutes = require("./routes/attendanceRoutes");
}

// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// PUBLIC FRONTEND PATH
//
// Project structure:
//
// student-performance-guidance-system/
// │
// ├── backend/
// │   └── server.js
// │
// └── public/
//     ├── login.html
//     ├── index.html
//     └── js/
//         └── api.js
//
// =====================================================

const publicPath = path.join(__dirname, "../public");

// =====================================================
// SERVER INFORMATION
// =====================================================

console.log("==============================================");
console.log("Student Performance & Career Guidance System");
console.log("==============================================");

console.log("Backend directory:", __dirname);
console.log("Public directory:", publicPath);
console.log("Public exists:", fs.existsSync(publicPath));
console.log("Vercel:", process.env.VERCEL || "false");

// =====================================================
// CORS CONFIGURATION
// =====================================================
//
// Frontend:
// https://student-performance-and-career-guid.vercel.app
//
// Local development:
// http://localhost:5500
// http://localhost:3000
// http://localhost:5000
//
// =====================================================

const allowedOrigins = [
    "https://student-performance-and-career-guid.vercel.app",
    "http://localhost:5500",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000"
];

// =====================================================
// CORS MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without Origin
            // Useful for Postman and server-side requests

            if (!origin) {
                return callback(null, true);
            }

            // Allow known frontend origins

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.warn(
                "CORS blocked origin:",
                origin
            );

            // Do not crash server
            // Simply deny the origin

            return callback(null, false);
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept"
        ],

        optionsSuccessStatus: 204
    })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use(
    (req, res, next) => {

        console.log(
            `${new Date().toISOString()} - ${req.method} ${req.originalUrl}`
        );

        next();
    }
);

// =====================================================
// SERVE FRONTEND
// =====================================================

if (fs.existsSync(publicPath)) {

    app.use(
        express.static(publicPath)
    );

    console.log(
        "Public folder loaded successfully"
    );

} else {

    console.warn(
        "Public folder not found:",
        publicPath
    );
}

// =====================================================
// API BASE
// GET /api
// =====================================================

app.get(
    "/api",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Express MySQL API is running",

            status: "OK",

            backend:
                "Node.js + Express.js",

            database:
                "MySQL"
        });
    }
);

// =====================================================
// API BASE WITH TRAILING SLASH
// GET /api/
// =====================================================

app.get(
    "/api/",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Student Performance & Career Guidance API is running",

            backend:
                "Node.js + Express.js",

            database:
                "MySQL"
        });
    }
);

// =====================================================
// AUTH ROUTES
//
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/admin-login
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

// =====================================================
// STUDENT ROUTES
// =====================================================

app.use(
    "/api/students",
    studentRoutes
);

// =====================================================
// ADMIN STUDENT ROUTES
// =====================================================

app.use(
    "/api/admin/students",
    studentRoutes
);

// =====================================================
// PERFORMANCE ROUTES
// =====================================================

app.use(
    "/api/performance",
    performanceRoutes
);

// =====================================================
// CAREER ROUTES
// =====================================================

app.use(
    "/api/careers",
    careerRoutes
);

app.use(
    "/api/career",
    careerRoutes
);

// =====================================================
// REPORT ROUTES
// =====================================================

app.use(
    "/api/reports",
    reportRoutes
);

// =====================================================
// COMPLAINT ROUTES
// =====================================================

app.use(
    "/api/complaints",
    complaintRoutes
);

// =====================================================
// ADMIN ROUTES
// =====================================================

app.use(
    "/api/admin",
    adminRoutes
);

// =====================================================
// SUBJECT ROUTES
// =====================================================

app.use(
    "/api/subjects",
    subjectRoutes
);

// =====================================================
// ATTENDANCE ROUTES
// =====================================================

if (attendanceRoutes) {

    app.use(
        "/api/attendance",
        attendanceRoutes
    );

} else {

    // GET ATTENDANCE

    app.get(
        "/api/attendance",
        (req, res) => {

            res.status(200).json({

                success: true,

                attendance: []
            });
        }
    );

    // ADD ATTENDANCE

    app.post(
        "/api/attendance",
        (req, res) => {

            res.status(200).json({

                success: true,

                message:
                    "Attendance saved"
            });
        }
    );

    // DELETE ATTENDANCE

    app.delete(
        "/api/attendance/:id",
        (req, res) => {

            res.status(200).json({

                success: true,

                message:
                    "Attendance deleted"
            });
        }
    );
}

// =====================================================
// ADMIN API TEST
// GET /api/admin-test
// =====================================================

app.get(
    "/api/admin-test",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Admin API test route is working"
        });
    }
);

// =====================================================
// SUBJECT API TEST
// GET /api/subjects-test
// =====================================================

app.get(
    "/api/subjects-test",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Subjects API route is working"
        });
    }
);

// =====================================================
// DATABASE TEST
// GET /api/db-test
// =====================================================

app.get(
    "/api/db-test",
    async (req, res) => {

        let connection;

        try {

            if (
                !db ||
                typeof db.getConnection !== "function"
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Database connection module is not configured correctly"
                });
            }

            connection =
                await db.getConnection();

            await connection.query(
                "SELECT 1"
            );

            return res.status(200).json({

                success: true,

                message:
                    "MySQL database connection is working"
            });

        } catch (error) {

            console.error(
                "Database test failed:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "MySQL database connection failed",

                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined
            });

        } finally {

            if (connection) {
                connection.release();
            }
        }
    }
);

// =====================================================
// FRONTEND TEST
// GET /frontend-test
// =====================================================

app.get(
    "/frontend-test",
    (req, res) => {

        res.status(200).json({

            success: true,

            publicPath:
                publicPath,

            publicExists:
                fs.existsSync(publicPath),

            loginHTML:
                fs.existsSync(
                    path.join(
                        publicPath,
                        "login.html"
                    )
                ),

            indexHTML:
                fs.existsSync(
                    path.join(
                        publicPath,
                        "index.html"
                    )
                ),

            adminSubjectsHTML:
                fs.existsSync(
                    path.join(
                        publicPath,
                        "admin-subjects.html"
                    )
                ),

            adminSubjectsJS:
                fs.existsSync(
                    path.join(
                        publicPath,
                        "js",
                        "admin-subjects.js"
                    )
                ),

            apiJS:
                fs.existsSync(
                    path.join(
                        publicPath,
                        "js",
                        "api.js"
                    )
                )
        });
    }
);

// =====================================================
// ADMIN SUBJECTS PAGE
// =====================================================

app.get(
    "/admin-subjects.html",
    (req, res) => {

        const filePath =
            path.join(
                publicPath,
                "admin-subjects.html"
            );

        if (!fs.existsSync(filePath)) {

            return res.status(404).send(
                "admin-subjects.html not found"
            );
        }

        return res.sendFile(
            filePath
        );
    }
);

// =====================================================
// ROOT PAGE
// GET /
// =====================================================

app.get(
    "/",
    (req, res) => {

        const loginFilePath =
            path.join(
                publicPath,
                "login.html"
            );

        const indexFilePath =
            path.join(
                publicPath,
                "index.html"
            );

        if (
            fs.existsSync(loginFilePath)
        ) {

            return res.sendFile(
                loginFilePath
            );
        }

        if (
            fs.existsSync(indexFilePath)
        ) {

            return res.sendFile(
                indexFilePath
            );
        }

        return res.status(200).json({

            success: true,

            message:
                "Student Performance & Career Guidance System is running",

            api:
                "/api"
        });
    }
);

// =====================================================
// API 404 HANDLER
// =====================================================

app.use(
    (req, res, next) => {

        if (
            req.originalUrl === "/api" ||
            req.originalUrl.startsWith("/api/")
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "API route not found",

                path:
                    req.originalUrl
            });
        }

        next();
    }
);

// =====================================================
// GENERAL 404
// =====================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Page not found",

            path:
                req.originalUrl
        });
    }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            err
        );

        if (
            req.originalUrl === "/api" ||
            req.originalUrl.startsWith("/api/")
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Internal server error",

                error:
                    process.env.NODE_ENV === "development"
                        ? err.message
                        : undefined
            });
        }

        return res.status(500).send(
            "Internal server error"
        );
    }
);

// =====================================================
// LOCAL SERVER
//
// Vercel does NOT use app.listen().
// Local development does.
// =====================================================

if (
    require.main === module &&
    process.env.VERCEL !== "1"
) {

    (async () => {

        try {

            if (
                db &&
                typeof db.getConnection === "function"
            ) {

                const connection =
                    await db.getConnection();

                console.log(
                    "MYSQL DATABASE CONNECTED"
                );

                connection.release();
            }

            app.listen(
                PORT,
                "0.0.0.0",
                () => {

                    console.log(
                        `Local server running at http://localhost:${PORT}`
                    );

                    console.log(
                        `API: http://localhost:${PORT}/api`
                    );
                }
            );

        } catch (error) {

            console.error(
                "Local server startup failed:",
                error
            );
        }
    })();
}

// =====================================================
// VERCEL SERVERLESS EXPORT
// =====================================================

module.exports = app;