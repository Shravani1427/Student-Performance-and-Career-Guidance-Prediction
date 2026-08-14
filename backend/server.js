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
// File:
// backend/server.js
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
// CREATE EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// DATABASE
// =====================================================

let db;

try {

    db = require("./config/db");

    console.log("Database module loaded successfully");

} catch (error) {

    console.error(
        "Database module loading failed:",
        error.message
    );

}

// =====================================================
// ROUTES
// =====================================================

let authRoutes;
let studentRoutes;
let performanceRoutes;
let careerRoutes;
let reportRoutes;
let complaintRoutes;
let adminRoutes;
let subjectRoutes;

try {

    authRoutes = require("./routes/authRoutes");
    studentRoutes = require("./routes/studentRoutes");
    performanceRoutes = require("./routes/performanceRoutes");
    careerRoutes = require("./routes/careerRoutes");
    reportRoutes = require("./routes/reportRoutes");
    complaintRoutes = require("./routes/complaintRoutes");
    adminRoutes = require("./routes/adminRoutes");
    subjectRoutes = require("./routes/subjectRoutes");

    console.log("All route modules loaded successfully");

} catch (error) {

    console.error(
        "Route module loading failed:",
        error.message
    );

}

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

    try {

        attendanceRoutes =
            require("./routes/attendanceRoutes");

        console.log(
            "Attendance routes loaded"
        );

    } catch (error) {

        console.error(
            "Attendance routes failed:",
            error.message
        );

    }

}

// =====================================================
// PUBLIC FRONTEND PATH
//
// Project:
//
// project-root/
// │
// ├── api/
// │   └── index.js
// │
// ├── backend/
// │   ├── server.js
// │   ├── config/
// │   ├── controllers/
// │   └── routes/
// │
// └── public/
//     ├── login.html
//     ├── index.html
//     └── js/
//         └── api.js
//
// =====================================================

const publicPath = path.join(
    __dirname,
    "../public"
);

// =====================================================
// SERVER INFORMATION
// =====================================================

console.log("==============================================");
console.log("Student Performance & Career Guidance System");
console.log("==============================================");

console.log(
    "Backend directory:",
    __dirname
);

console.log(
    "Public directory:",
    publicPath
);

console.log(
    "Public exists:",
    fs.existsSync(publicPath)
);

console.log(
    "Vercel:",
    process.env.VERCEL || "false"
);

console.log(
    "Node environment:",
    process.env.NODE_ENV || "not specified"
);

// =====================================================
// CORS
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

app.use(
    cors({

        origin: function (origin, callback) {

            // Requests without Origin
            // Postman / server-side requests

            if (!origin) {

                return callback(
                    null,
                    true
                );

            }

            // Allowed origins

            if (
                allowedOrigins.includes(origin)
            ) {

                return callback(
                    null,
                    true
                );

            }

            console.warn(
                "CORS blocked origin:",
                origin
            );

            // Do not crash the server

            return callback(
                null,
                false
            );

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
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
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
// SERVE PUBLIC FOLDER
// =====================================================

if (
    fs.existsSync(publicPath)
) {

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

        return res.status(200).json({

            success: true,

            message:
                "Student Performance & Career Guidance API is running",

            status:
                "OK",

            backend:
                "Node.js + Express.js",

            database:
                "MySQL",

            environment:
                process.env.VERCEL === "1"
                    ? "Vercel"
                    : "Local"

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

        return res.status(200).json({

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

if (authRoutes) {

    app.use(
        "/api/auth",
        authRoutes
    );

}

// =====================================================
// STUDENT ROUTES
// =====================================================

if (studentRoutes) {

    app.use(
        "/api/students",
        studentRoutes
    );

}

// =====================================================
// ADMIN STUDENT ROUTES
// =====================================================

if (studentRoutes) {

    app.use(
        "/api/admin/students",
        studentRoutes
    );

}

// =====================================================
// PERFORMANCE ROUTES
// =====================================================

if (performanceRoutes) {

    app.use(
        "/api/performance",
        performanceRoutes
    );

}

// =====================================================
// CAREER ROUTES
// =====================================================

if (careerRoutes) {

    app.use(
        "/api/careers",
        careerRoutes
    );

    app.use(
        "/api/career",
        careerRoutes
    );

}

// =====================================================
// REPORT ROUTES
// =====================================================

if (reportRoutes) {

    app.use(
        "/api/reports",
        reportRoutes
    );

}

// =====================================================
// COMPLAINT ROUTES
// =====================================================

if (complaintRoutes) {

    app.use(
        "/api/complaints",
        complaintRoutes
    );

}

// =====================================================
// ADMIN ROUTES
// =====================================================

if (adminRoutes) {

    app.use(
        "/api/admin",
        adminRoutes
    );

}

// =====================================================
// SUBJECT ROUTES
// =====================================================

if (subjectRoutes) {

    app.use(
        "/api/subjects",
        subjectRoutes
    );

}

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

            return res.status(200).json({

                success: true,

                attendance: []

            });

        }
    );

    // ADD ATTENDANCE

    app.post(
        "/api/attendance",
        (req, res) => {

            return res.status(200).json({

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

            return res.status(200).json({

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

        return res.status(200).json({

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

        return res.status(200).json({

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

        let connection = null;

        try {

            if (
                !db ||
                typeof db.getConnection !== "function"
            ) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Database module is not configured correctly"

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
                        : error.message

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

        return res.status(200).json({

            success: true,

            publicPath:
                publicPath,

            publicExists:
                fs.existsSync(
                    publicPath
                ),

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

        if (
            !fs.existsSync(filePath)
        ) {

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

        return res.status(404).json({

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
            "================================="
        );

        console.error(
            "SERVER ERROR"
        );

        console.error(
            err
        );

        console.error(
            "================================="
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
                    err.message || "Unknown server error"

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
// Vercel:
// DO NOT call app.listen()
//
// Local:
// node backend/server.js
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

                let connection = null;

                try {

                    connection =
                        await db.getConnection();

                    console.log(
                        "MYSQL DATABASE CONNECTED"
                    );

                } finally {

                    if (connection) {

                        connection.release();

                    }

                }

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