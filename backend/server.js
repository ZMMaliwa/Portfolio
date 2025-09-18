import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "*",
}));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  const fullName = `${firstName} ${lastName}`;

  try {
    // Email to portfolio owner
    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Message from ${fullName} (${email})`,
      text: `You received a message:\n\nFull Name: ${fullName}\nEmail: ${email}\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // Auto-response to sender
    await transporter.sendMail({
      from: `"Zukisa's Portfolio" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Auto-Response",
      text: `Hi ${firstName},\n\nThank you for your message! I will respond within 24 hours.\n\nYour message:\n${message}`,
      html: `
        <p>Hi ${firstName},</p>
        <p>Thank you for your message! I will respond within 24 hours.</p>
        <p><strong>Your message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
        <br/>
        <p>Best regards,<br>Zukisa</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send email." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
