const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        companyName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            default: "",
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
