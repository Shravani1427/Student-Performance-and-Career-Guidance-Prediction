"use strict";

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createOrUpdateAdmin() {
    const email = "test@gmail.com";
    const password = "admin123";
    const name = "Updated Student";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [existing] = await db.execute(
            "SELECT id FROM students WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length > 0) {
            await db.execute(
                `UPDATE students
                 SET name = ?, password = ?, role = 'admin'
                 WHERE email = ?`,
                [name, hashedPassword, email]
            );

            console.log("======================================");
            console.log("✅ ADMIN PASSWORD UPDATED");
            console.log("======================================");
        } else {
            const [result] = await db.execute(
                `INSERT INTO students
                (name, email, password, phone, role)
                VALUES (?, ?, ?, ?, 'admin')`,
                [
                    name,
                    email,
                    hashedPassword,
                    "9999999999"
                ]
            );

            console.log("======================================");
            console.log("✅ ADMIN CREATED");
            console.log("ID:", result.insertId);
            console.log("======================================");
        }

        console.log("Email    :", email);
        console.log("Password :", password);
        console.log("Role     : admin");
        console.log("======================================");

    } catch (error) {
        console.error("❌ ERROR:", error);
    } finally {
        process.exit();
    }
}

createOrUpdateAdmin();