const nodemailer = require("nodemailer");

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPEmail = async (email, name, otp) => {

    console.log("Sending OTP email...");
    console.log("To:", email);

    const mailOptions = {
        from: `"InternshipX" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your InternshipX Account",

        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:10px">
            <h2 style="color:#2563EB;">InternshipX</h2>

            <p>Hello <strong>${name}</strong>,</p>

            <p>Thank you for registering with InternshipX.</p>

            <p>Your verification code is:</p>

            <h1 style="
                text-align:center;
                letter-spacing:8px;
                color:#2563EB;
                background:#F3F4F6;
                padding:20px;
                border-radius:8px;
            ">
                ${otp}
            </h1>

            <p>This OTP is valid for 10 minutes.</p>

            <hr>

            <p style="font-size:13px;color:#6B7280;">
                Crafted by ByteForge
            </p>
        </div>
        `
    };

    console.log("Sending OTP email...");
    console.log("To:", email);

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
};

module.exports = sendOTPEmail;