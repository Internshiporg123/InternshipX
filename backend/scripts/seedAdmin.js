require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in the environment.");
    process.exit(1);
}

if (!adminEmail || !adminPassword) {
    console.error("❌ Error: ADMIN_EMAIL or ADMIN_PASSWORD is not defined in your .env file.");
    process.exit(1);
}

async function seedAdmin() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`⚠️ Admin user already exists: ${adminEmail}`);
            existingAdmin.role = "admin";
            existingAdmin.isVerified = true;
            existingAdmin.isBlocked = false;

            const hashedNewPassword = await bcrypt.hash(adminPassword, 10);
            existingAdmin.password = hashedNewPassword;

            await existingAdmin.save();
            console.log("Updated existing admin role, password, verification and block status.");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
            name: "System Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            isVerified: true,
            isBlocked: false
        });

        console.log("=========================================");
        console.log("🎉 Admin user created successfully!");
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log("=========================================");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding admin failed:", error);
        process.exit(1);
    }
}

seedAdmin();