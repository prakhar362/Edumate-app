import os
import resend

# Set API key
resend.api_key = os.getenv("RESEND_API_KEY")


def send_otp_email(to_email: str, otp: str):
    subject = "Your Password Reset OTP"

    html_content = f"""
    <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color:#4F46E5;">{otp}</h1>
        <p>This OTP will expire in <b>5 minutes</b>.</p>
    </div>
    """

    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": to_email,
        "subject": subject,
        "html": html_content,
    })
