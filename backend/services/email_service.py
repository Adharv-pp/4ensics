import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

logger = logging.getLogger("EmailService")

def get_smtp_config():
    """Fetches latest SMTP settings from environment."""
    load_dotenv(override=True)
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "from_email": os.getenv("SMTP_FROM_EMAIL", "notifications@4ensics.ai").strip(),
        "from_name": os.getenv("SMTP_FROM_NAME", "4ensics Forensic Platform").strip(),
        "platform_url": os.getenv("PLATFORM_URL", "http://localhost:5173").strip()
    }

def generate_user_added_email_html(
    new_user_name: str,
    new_user_email: str,
    added_by_name: str,
    role: str = "Forensic Analyst",
    temporary_password: Optional[str] = None,
    platform_url: str = "http://localhost:5173"
) -> str:
    """
    Generates a responsive, branded HTML email for user invitations.
    """
    temp_pass_html = ""
    if temporary_password:
        temp_pass_html = f"""
        <div style="background-color: #1A1C25; border: 1px solid #2D313E; border-radius: 6px; padding: 14px; margin: 18px 0;">
            <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8F92A1; font-weight: 600;">Your Initial Access Credentials</p>
            <p style="margin: 0; font-size: 13px; color: #E4E5EA; font-family: monospace;"><strong>Email:</strong> {new_user_email}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #FF7A00; font-family: monospace;"><strong>Temporary Password:</strong> {temporary_password}</p>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You have been added to 4ensics</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0B0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E4E5EA; line-height: 1.6;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0B0E; padding: 40px 10px;">
        <tr>
            <td align="center">
                <!-- Main Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #13151C; border: 1px solid #232634; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #181B26 0%, #11131A 100%); border-bottom: 2px solid #FF7A00; padding: 32px 30px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                <tr>
                                    <td style="background-color: rgba(255,122,0,0.15); border: 1px solid rgba(255,122,0,0.35); border-radius: 8px; width: 44px; height: 44px; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 22px; line-height: 44px; color: #FF7A00;">🛡️</span>
                                    </td>
                                    <td style="padding-left: 14px; text-align: left;">
                                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">4ensics</h1>
                                        <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #FF7A00;">Forensic Media Intelligence</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 30px;">
                            <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FFFFFF;">
                                Welcome to 4ensics, {new_user_name}
                            </h2>
                            
                            <p style="margin: 0 0 16px 0; font-size: 14px; color: #A0A4B8;">
                                <strong style="color: #FFFFFF;">{added_by_name}</strong> has added you to the <strong style="color: #FF7A00;">4ensics Media Intelligence Platform</strong> as an authorized <strong style="color: #FFFFFF;">{role}</strong>.
                            </p>

                            <!-- Role Badge & Account Details -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0E0F14; border: 1px solid #1F222E; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 6px 0; font-size: 13px; color: #8F92A1;">Invited By:</td>
                                    <td style="padding: 6px 0; font-size: 13px; color: #E4E5EA; font-weight: 600; text-align: right;">{added_by_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 13px; color: #8F92A1;">Assigned Role:</td>
                                    <td style="padding: 6px 0; font-size: 13px; color: #4CAF50; font-weight: 600; text-align: right;">{role}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; font-size: 13px; color: #8F92A1;">Authorized Email:</td>
                                    <td style="padding: 6px 0; font-size: 13px; color: #E4E5EA; font-family: monospace; text-align: right;">{new_user_email}</td>
                                </tr>
                            </table>

                            {temp_pass_html}

                            <p style="margin: 0 0 24px 0; font-size: 13px; color: #8F92A1;">
                                You now have access to video deepfake classification, image ELA/FFT forensic analysis, acoustic voice authenticity checks, and text analysis tools.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="{platform_url}" target="_blank" style="display: inline-block; background-color: #FF7A00; color: #0D0E12; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 36px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(255,122,0,0.3);">
                                            Sign In to 4ensics
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Note -->
                            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #1F222E;">
                                <p style="margin: 0; font-size: 11px; color: #696C7D; line-height: 1.5;">
                                    <strong>Security Notice:</strong> This invitation was initiated by an authorized administrator. If you were not expecting this notification, please notify your agency IT administrator.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0E0F14; border-top: 1px solid #1A1C25; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #525565;">
                                &copy; 2026 4ensics Media Intelligence Platform. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html

def send_smtp_email(to_email: str, subject: str, html_body: str, plain_body: str) -> Dict[str, Any]:
    """
    Sends an email using standard SMTP (supports STARTTLS on port 587 and SSL on port 465).
    """
    config = get_smtp_config()
    host = config["host"]
    port = config["port"]
    user = config["user"]
    password = config["password"]
    from_email = config["from_email"] or user
    from_name = config["from_name"]

    # Check if credentials are placeholders
    if not user or not password or "your_" in password or "your_" in user:
        logger.warning(
            f"SMTP credentials not fully configured in .env (user='{user}'). "
            "Please update SMTP_USER and SMTP_PASSWORD in backend/.env to dispatch real emails."
        )
        return {
            "sent": False,
            "error": "SMTP credentials not configured in .env",
            "details": "Please set SMTP_USER and SMTP_PASSWORD in backend/.env",
            "recipient": to_email,
            "subject": subject,
            "html_preview": html_body
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(plain_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if port == 465:
            # SSL
            with smtplib.SMTP_SSL(host, port, timeout=20) as server:
                server.login(user, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            # TLS (587, 25)
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.sendmail(from_email, [to_email], msg.as_string())

        logger.info(f"SMTP email successfully delivered to '{to_email}' via {host}:{port}")
        return {
            "sent": True,
            "recipient": to_email,
            "subject": subject,
            "host": host,
            "port": port
        }

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        return {
            "sent": False,
            "error": "SMTP Authentication Failed (Check your email password/App Password in .env)",
            "details": str(e),
            "recipient": to_email,
            "html_preview": html_body
        }
    except Exception as e:
        logger.error(f"SMTP Delivery failed for {to_email}: {e}")
        return {
            "sent": False,
            "error": str(e),
            "recipient": to_email,
            "html_preview": html_body
        }

def send_user_added_email(
    new_user_name: str,
    new_user_email: str,
    added_by_name: str,
    role: str = "Forensic Analyst",
    temporary_password: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends the 'User Added by [Name]' HTML email directly via SMTP.
    """
    config = get_smtp_config()
    subject = f"You have been added to 4ensics by {added_by_name}"
    
    html_content = generate_user_added_email_html(
        new_user_name=new_user_name,
        new_user_email=new_user_email,
        added_by_name=added_by_name,
        role=role,
        temporary_password=temporary_password,
        platform_url=config["platform_url"]
    )
    
    plain_content = (
        f"Welcome to 4ensics, {new_user_name}!\n\n"
        f"{added_by_name} has added you to the 4ensics Platform as an authorized {role}.\n\n"
        f"Access URL: {config['platform_url']}\n"
    )
    if temporary_password:
        plain_content += f"Email: {new_user_email}\nTemporary Password: {temporary_password}\n"

    return send_smtp_email(
        to_email=new_user_email,
        subject=subject,
        html_body=html_content,
        plain_body=plain_content
    )
