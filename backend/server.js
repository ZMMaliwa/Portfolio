import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_TO"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.FRONTEND_ORIGIN;

app.use(express.json({ limit: "10kb" }));
app.use(
  cors({
    origin: isProduction ? frontendOrigin : frontendOrigin || "*",
  }),
);

const contactRateWindowMs = 15 * 60 * 1000;
const maxContactRequests = 10;
const requestBuckets = new Map();

function contactRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = requestBuckets.get(ip);

  if (!bucket || bucket.expiresAt <= now) {
    requestBuckets.set(ip, { count: 1, expiresAt: now + contactRateWindowMs });
    return next();
  }

  if (bucket.count >= maxContactRequests) {
    return res.status(429).json({
      success: false,
      error: "Too many contact requests. Please try again later.",
    });
  }

  bucket.count += 1;
  requestBuckets.set(ip, bucket);
  return next();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePayload(payload) {
  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const message = payload.message?.trim() ?? "";

  return { firstName, lastName, email, message };
}

function validatePayload({ firstName, lastName, email, message }) {
  const errors = [];

  if (!firstName || firstName.length > 50) {
    errors.push("First name is required and must be 50 characters or fewer.");
  }

  if (!lastName || lastName.length > 50) {
    errors.push("Last name is required and must be 50 characters or fewer.");
  }

  if (!email || !isValidEmail(email)) {
    errors.push("A valid email address is required.");
  }

  if (!message || message.length < 10 || message.length > 2000) {
    errors.push("Message must be between 10 and 2000 characters.");
  }

  return errors;
}

app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Portfolio contact API is running." });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.post("/api/contact", contactRateLimiter, async (req, res) => {
  const { firstName, lastName, email, message } = normalizePayload(req.body);
  const errors = validatePayload({ firstName, lastName, email, message });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const fullName = `${firstName} ${lastName}`;
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br>");

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Message from ${fullName} (${email})`,
      text: `You received a message:\n\nFull Name: ${fullName}\nEmail: ${email}\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong><br>${safeMessageHtml}</p>
      `,
    });

    await transporter.sendMail({
      from: `"Zukisa's Portfolio" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Auto-Response",
      text: `Hi ${firstName},\n\nThank you for your message! I will respond within 24 hours.\n\nYour message:\n${message}`,
      html: `
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Thank you for your message! I will respond within 24 hours.</p>
        <p><strong>Your message:</strong><br>${safeMessageHtml}</p>
        <br/>
        <p>Best regards,<br>Zukisa</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact request failed", err);
    return res.status(500).json({ success: false, error: "Failed to send email." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
