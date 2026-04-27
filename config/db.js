const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

async function seedDefaultAdmin() {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "";

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await Admin.create({
        username,
        passwordHash
    });
}

async function connectDb() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/placement_system";

    await mongoose.connect(mongoUri);
    await seedDefaultAdmin();

    console.log("MongoDB connected");
}

module.exports = connectDb;
