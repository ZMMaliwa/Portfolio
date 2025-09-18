    import nodemailer from "nodemailer";
    import dotenv from "dotenv";

    dotenv.config();

    async function testSMTP() {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || "true") === "true", // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        });

        // Verify connection
        await transporter.verify();
        console.log("✅ SMTP connection successful!");

        // Send a test email
        const info = await transporter.sendMail({
        from: `"SMTP Test" <${process.env.SMTP_USER}>`,
        to: process.env.EMAIL_TO,
        subject: "Test Email from Nodemailer",
        text: "This is a test email to confirm SMTP configuration.",
        });

        console.log("📧 Test email sent!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ SMTP test failed:", error);
    }
    }

    testSMTP();