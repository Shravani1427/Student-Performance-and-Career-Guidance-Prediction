"use strict";

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function updateAdminCredentials() {
  try {
    const newName = "Shravani-Admin";
    const newEmail = "shravanichavan779@gmail.com"; // Set your preferred email here
    const rawPassword = "Shravani@#2707";
    
    // Hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Update Administrator user in database
    await db.execute(
      "UPDATE students SET name = ?, email = ?, password = ? WHERE role = 'admin' OR id = 1",
      [newName, newEmail.toLowerCase(), hashedPassword]
    );

    console.log("✅ Admin updated successfully!");
    console.log(`👤 Name: ${newName}`);
    console.log(`📧 Email: ${newEmail}`);
    console.log(`🔐 Password: ${rawPassword}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

updateAdminCredentials();