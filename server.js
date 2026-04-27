require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const companyRoutes = require("./routes/company");
const adminRoutes = require("./routes/admin");

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);

const port = process.env.PORT || 5000;

connectDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
    });
