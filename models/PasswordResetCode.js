const mongoose = require("mongoose");

const passwordResetCodeSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["student", "company"],
            required: true
        },
        usernameKey: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        codeHash: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        attempts: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

passwordResetCodeSchema.index({ role: 1, usernameKey: 1 }, { unique: true });
passwordResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordResetCode", passwordResetCodeSchema);
