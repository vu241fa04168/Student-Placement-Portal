const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Student = require("../models/Student");
const Company = require("../models/Company");
const Admin = require("../models/Admin");
const PasswordResetCode = require("../models/PasswordResetCode");

const router = express.Router();

const RESET_CODE_EXPIRY_MINUTES = Number(process.env.RESET_CODE_EXPIRY_MINUTES || 10);
const RESET_CODE_MAX_ATTEMPTS = 5;

function parseList(value) {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    return String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT secret missing in .env");
    }

    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

function normalizeUsernameKey(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function maskEmail(email) {
    const normalized = normalizeEmail(email);
    const [name = "", domain = ""] = normalized.split("@");
    if (!name || !domain) {
        return normalized;
    }

    if (name.length <= 2) {
        return `${name[0] || "*"}*@${domain}`;
    }

    return `${name.slice(0, 2)}***@${domain}`;
}

function generateResetCode() {
    return String(crypto.randomInt(100000, 1000000));
}

function hashResetCode(code) {
    const salt = process.env.RESET_CODE_SECRET || process.env.JWT_SECRET || "placement-reset-secret";
    return crypto
        .createHash("sha256")
        .update(`${String(code)}:${salt}`)
        .digest("hex");
}

async function sendBrevoEmail({ toEmail, toName, subject, textContent, htmlContent }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Placement Portal";

    console.log(`[Brevo] Attempting to send email from ${senderEmail} to ${toEmail}`);
    console.log(`[Brevo] API Key configured: ${apiKey ? "Yes" : "No"}`);

    if (!apiKey || !senderEmail) {
        throw new Error("Brevo mail configuration missing in .env");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": apiKey
        },
        body: JSON.stringify({
            sender: { email: senderEmail, name: senderName },
            to: [{ email: toEmail, name: toName || toEmail }],
            subject,
            textContent,
            htmlContent
        })
    });

    console.log(`[Brevo] Response status: ${response.status}`);

    if (!response.ok) {
        const errorPayload = await response.text();
        console.error(`[Brevo] Error response: ${errorPayload}`);
        throw new Error(`Brevo send failed: ${response.status} ${errorPayload}`);
    }

    console.log(`[Brevo] Email sent successfully`);
}

async function sendRoleResetCode(req, res, options) {
    const {
        role,
        Model,
        queryBuilder,
        getEmail,
        getDisplayName
    } = options;

    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: "Username and email are required" });
        }

        const query = queryBuilder(req.body);
        if (!query) {
            return res.status(400).json({ message: "Required verification details are missing" });
        }

        const user = await Model.findOne({ username, ...query });
        if (!user) {
            return res.status(404).json({ message: "Matching account not found for the provided details" });
        }

        const registeredEmail = normalizeEmail(getEmail(user));
        const inputEmail = normalizeEmail(email);

        if (!registeredEmail) {
            return res.status(400).json({
                message: "No recovery email is configured for this account. Update profile email first."
            });
        }

        if (registeredEmail !== inputEmail) {
            return res.status(400).json({ message: "Provided email does not match the registered email" });
        }

        const otpCode = generateResetCode();
        const codeHash = hashResetCode(otpCode);
        const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000);

        await PasswordResetCode.findOneAndUpdate(
            { role, usernameKey: normalizeUsernameKey(username) },
            {
                role,
                usernameKey: normalizeUsernameKey(username),
                email: registeredEmail,
                codeHash,
                expiresAt,
                attempts: 0
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const displayName = getDisplayName(user);
        const subject = `${role === "student" ? "Student" : "Company"} password reset code`;
        const textContent = `Hello ${displayName}, your password reset code is ${otpCode}. This code expires in ${RESET_CODE_EXPIRY_MINUTES} minutes.`;
        const htmlContent = `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
                <p>Hello ${displayName},</p>
                <p>Your password reset code is:</p>
                <p style="font-size:26px;font-weight:700;letter-spacing:6px;margin:14px 0;color:#2563eb;">${otpCode}</p>
                <p>This code expires in ${RESET_CODE_EXPIRY_MINUTES} minutes.</p>
                <p>If you did not request this reset, you can ignore this email.</p>
            </div>
        `;

        await sendBrevoEmail({
            toEmail: registeredEmail,
            toName: displayName,
            subject,
            textContent,
            htmlContent
        });

        res.json({
            message: `Verification code sent to ${maskEmail(registeredEmail)}`
        });
    } catch (error) {
        console.error(`${role} send reset code error:`, error.message);
        console.error(`${role} error stack:`, error);
        res.status(500).json({ message: "Could not send reset email. Check Brevo configuration and try again." });
    }
}

async function verifyRoleResetCode(req, res, options) {
    const {
        role,
        Model,
        queryBuilder,
        getEmail
    } = options;

    try {
        const { username, email, otpCode, newPassword } = req.body;

        if (!username || !email || !otpCode) {
            return res.status(400).json({ message: "Username, email, and OTP code are required" });
        }

        const query = queryBuilder(req.body);
        if (!query) {
            return res.status(400).json({ message: "Required verification details are missing" });
        }

        const user = await Model.findOne({ username, ...query });
        if (!user) {
            return res.status(404).json({ message: "Matching account not found for the provided details" });
        }

        const registeredEmail = normalizeEmail(getEmail(user));
        const inputEmail = normalizeEmail(email);
        if (!registeredEmail || registeredEmail !== inputEmail) {
            return res.status(400).json({ message: "Provided email does not match the registered email" });
        }

        const resetCode = await PasswordResetCode.findOne({
            role,
            usernameKey: normalizeUsernameKey(username)
        });

        if (!resetCode) {
            return res.status(400).json({ message: "Reset code missing or expired. Please request a new code." });
        }

        if (resetCode.expiresAt.getTime() < Date.now()) {
            await PasswordResetCode.deleteOne({ _id: resetCode._id });
            return res.status(400).json({ message: "Reset code expired. Please request a new code." });
        }

        const providedCodeHash = hashResetCode(otpCode);

        if (resetCode.codeHash !== providedCodeHash) {
            resetCode.attempts += 1;

            if (resetCode.attempts >= RESET_CODE_MAX_ATTEMPTS) {
                await PasswordResetCode.deleteOne({ _id: resetCode._id });
                return res.status(429).json({ message: "Too many invalid attempts. Request a new reset code." });
            }

            await resetCode.save();
            return res.status(400).json({ message: "Invalid reset code" });
        }

        // If newPassword is provided, update it; otherwise just verify
        if (newPassword) {
            user.passwordHash = await bcrypt.hash(newPassword, 10);
            await user.save();
            await PasswordResetCode.deleteOne({ _id: resetCode._id });
            res.json({ message: `${role} password reset successful` });
        } else {
            // Just verification, don't delete code yet
            res.json({ message: "Reset code verified. Please provide a new password." });
        }
    } catch (error) {
        console.error(`${role} verify reset code error:`, error.message);
        console.error(`${role} error stack:`, error);
        res.status(500).json({ message: "Server error during password reset" });
    }
}

router.post("/signup/student", async (req, res) => {
    try {
        const {
            username,
            password,
            rollNumber,
            firstName,
            lastName,
            branch,
            yearOfStudy,
            cgpa,
            currentBacklogs,
            pastBacklogs,
            programmingLanguages,
            email,
            phone,
            address
        } = req.body;

        if (
            !username || !password || !rollNumber || !firstName || !lastName ||
            !branch || yearOfStudy === undefined || cgpa === undefined ||
            currentBacklogs === undefined || !email
        ) {
            return res.status(400).json({ message: "All required student fields, including email, must be filled" });
        }

        const existingStudent = await Student.findOne({
            $or: [{ username }, { rollNumber }]
        });

        if (existingStudent) {
            return res.status(400).json({ message: "Student username or roll number already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await Student.create({
            username,
            passwordHash,
            rollNumber,
            firstName,
            lastName,
            branch,
            yearOfStudy: Number(yearOfStudy),
            cgpa: Number(cgpa),
            currentBacklogs: Number(currentBacklogs),
            pastBacklogs: Number(pastBacklogs || 0),
            programmingLanguages: parseList(programmingLanguages),
            email: normalizeEmail(email),
            phone,
            address
        });

        res.status(201).json({ message: "Student signup successful" });
    } catch (error) {
        console.error("Student signup error:", error);
        res.status(500).json({ message: "Server error during student signup" });
    }
});

router.post("/signup/company", async (req, res) => {
    try {
        const {
            username,
            password,
            companyName,
            email
        } = req.body;

        if (!username || !password || !companyName || !email) {
            return res.status(400).json({ message: "Username, company name, email, and password are required" });
        }

        const existingCompany = await Company.findOne({
            $or: [{ username }, { companyName }]
        });

        if (existingCompany) {
            return res.status(400).json({ message: "Company username or company name already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await Company.create({
            username,
            passwordHash,
            companyName,
            email: normalizeEmail(email)
        });

        res.status(201).json({ message: "Company signup successful" });
    } catch (error) {
        console.error("Company signup error:", error);
        res.status(500).json({ message: "Server error during company signup" });
    }
});

async function handleRoleLogin(req, res, Model, role) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await Model.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = createToken({ _id: user._id, role });

        res.json({ token, role });
    } catch (error) {
        console.error(`${role} login error:`, error);
        res.status(500).json({ message: "Server error during login" });
    }
}

async function handlePasswordReset(req, res, Model, queryBuilder, role) {
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ message: "Username and new password are required" });
        }

        const query = queryBuilder(req.body);

        if (!query) {
            return res.status(400).json({ message: "Required verification details are missing" });
        }

        const user = await Model.findOne({ username, ...query });

        if (!user) {
            return res.status(404).json({ message: "Matching account not found for the provided details" });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: `${role} password reset successful` });
    } catch (error) {
        console.error(`${role} password reset error:`, error);
        res.status(500).json({ message: "Server error during password reset" });
    }
}

router.post("/login/student", (req, res) => handleRoleLogin(req, res, Student, "student"));
router.post("/login/company", (req, res) => handleRoleLogin(req, res, Company, "company"));
router.post("/login/admin", (req, res) => handleRoleLogin(req, res, Admin, "admin"));

router.post("/forgot-password/student/send-otp", (req, res) =>
    sendRoleResetCode(req, res, {
        role: "student",
        Model: Student,
        queryBuilder: () => ({}),
        getEmail: (student) => student.email,
        getDisplayName: (student) => `${student.firstName} ${student.lastName}`.trim() || student.username
    })
);

router.post("/forgot-password/student/verify-otp", (req, res) =>
    verifyRoleResetCode(req, res, {
        role: "student",
        Model: Student,
        queryBuilder: () => ({}),
        getEmail: (student) => student.email
    })
);

router.post("/forgot-password/company/send-otp", (req, res) =>
    sendRoleResetCode(req, res, {
        role: "company",
        Model: Company,
        queryBuilder: () => ({}),
        getEmail: (company) => company.email,
        getDisplayName: (company) => company.companyName || company.username
    })
);

router.post("/forgot-password/company/verify-otp", (req, res) =>
    verifyRoleResetCode(req, res, {
        role: "company",
        Model: Company,
        queryBuilder: () => ({}),
        getEmail: (company) => company.email
    })
);

router.post("/forgot-password/student", (req, res) =>
    verifyRoleResetCode(req, res, {
        role: "student",
        Model: Student,
        queryBuilder: () => ({}),
        getEmail: (student) => student.email
    })
);

router.post("/forgot-password/company", (req, res) =>
    verifyRoleResetCode(req, res, {
        role: "company",
        Model: Company,
        queryBuilder: () => ({}),
        getEmail: (company) => company.email
    })
);

router.post("/forgot-password/admin", (req, res) =>
    handlePasswordReset(
        req,
        res,
        Admin,
        ({ resetKey }) => {
            if (!resetKey || !process.env.ADMIN_RESET_KEY || resetKey !== process.env.ADMIN_RESET_KEY) {
                return null;
            }

            return {};
        },
        "admin"
    )
);

router.post("/theme-log", (req, res) => {
    const { mode, page, changedAt } = req.body || {};
    const normalizedMode = mode === "night" ? "night" : "day";
    const normalizedPage = page || "unknown-page";
    const timestamp = changedAt || new Date().toISOString();

    console.log(`[Theme Toggle] mode=${normalizedMode} page=${normalizedPage} at=${timestamp}`);
    res.json({ message: "Theme change logged" });
});

module.exports = router;
