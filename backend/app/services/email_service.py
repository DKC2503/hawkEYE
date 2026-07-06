import smtplib
import json
import logging
import urllib.request
import urllib.error
import datetime
from email.message import EmailMessage
from typing import Dict, Any
from app.core.config import settings
from app.utils.location import extract_report_location

logger = logging.getLogger("hawkEYE.email_service")

class EmailService:
    def send_work_assignment_email(self, work_order: Dict[str, Any]) -> Dict[str, Any]:
        smtp_email = settings.SMTP_EMAIL
        smtp_password = settings.SMTP_APP_PASSWORD
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT

        has_smtp = bool(smtp_email and smtp_password)
        has_resend = bool(settings.RESEND_API_KEY)

        if not has_smtp and not has_resend:
            logger.warning("Neither SMTP credentials nor Resend API key configured in backend/.env.")
            return {
                "success": False,
                "status": "FAILED",
                "failureReason": "SMTP_NOT_CONFIGURED: SMTP credentials missing in backend/.env",
            }

        ticket_id = work_order.get("ticketId", "N/A")
        work_order_id = work_order.get("workOrderId", "N/A")
        wo_number = work_order.get("workOrderNumber", work_order_id)
        employee_name = work_order.get("employeeName", "Municipal Worker")
        employee_email = work_order.get("employeeEmail")

        if not employee_email or not isinstance(employee_email, str) or "@" not in employee_email:
            logger.error(f"Cannot send work order email. Invalid worker official email: '{employee_email}'")
            return {
                "success": False,
                "status": "FAILED",
                "failureReason": f"INVALID_RECIPIENT: Worker '{employee_name}' has no valid official email address.",
            }

        category = str(work_order.get("issueCategory", "Municipal Hazard")).upper()
        summary = work_order.get("issueSummary", "Civic issue report requiring field action.")
        priority = str(work_order.get("priority", "MEDIUM")).upper()
        image_url = work_order.get("imageUrl") or "https://via.placeholder.com/600x400?text=hawkEYE+Work+Order"

        # Extract normalized report location
        loc_info = extract_report_location(work_order)

        area = loc_info.get("area") or "Area Not Specified"
        address = loc_info.get("address") or "Address Not Specified"

        has_valid_coords = loc_info.get("is_valid", False)
        if has_valid_coords:
            lat = loc_info["latitude"]
            lng = loc_info["longitude"]
            # Preserve full precision in URL query
            maps_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
            coords_display = f"{lat:.4f}, {lng:.4f}"
            btn_maps_html = f'<a href="{maps_url}" target="_blank" class="btn-maps">📍 OPEN IN MAPS / NAVIGATION</a>'
            maps_text_line = f"- Navigation Link: {maps_url}"
        else:
            logger.warning(f"Work order '{wo_number}' (Ticket: {ticket_id}) has missing or invalid coordinates. Omitting navigation button.")
            maps_url = None
            coords_display = "Not Provided / Unavailable"
            btn_maps_html = '<div style="color: #94a3b8; font-size: 12px; font-style: italic; margin-top: 12px;">Map navigation button omitted (Coordinates unavailable).</div>'
            maps_text_line = "- Navigation Link: Not Available (Coordinates missing)"

        assignment_date = work_order.get("assignmentDate", "N/A")
        if isinstance(assignment_date, str) and "T" in assignment_date:
            assignment_date = assignment_date.split("T")[0]

        shift_info = work_order.get("shift", {})
        shift_name = shift_info.get("name", "Morning Shift") if isinstance(shift_info, dict) else str(shift_info)
        shift_start = shift_info.get("startTime", "08:00 AM") if isinstance(shift_info, dict) else "08:00 AM"
        shift_end = shift_info.get("endTime", "04:00 PM") if isinstance(shift_info, dict) else "04:00 PM"

        is_reassigned = bool(work_order.get("isReassigned"))
        reassign_reason = work_order.get("reassignmentReason") or ""

        badge_text = "REASSIGNED WORK ORDER" if is_reassigned else "NEW WORK ASSIGNMENT"
        subject_title = f"REASSIGNED: hawkEYE Work Order — {ticket_id}" if is_reassigned else f"New hawkEYE Work Assignment — {ticket_id}"
        lead_text = "You have been reassigned a municipal work order for urgent field inspection and resolution." if is_reassigned else "You have been assigned a new municipal work order for urgent field inspection and resolution."

        instructions = work_order.get("authorityInstructions") or ""

        # Build Plain-Text Fallback
        text_content = f"""
hawkEYE MUNICIPAL WORK ORDER ASSIGNMENT ({badge_text})
========================================
Hello {employee_name},

{lead_text}
{f'Reassignment Reason: {reassign_reason}' if is_reassigned and reassign_reason else ''}

TICKET DETAILS:
- Ticket ID: {ticket_id}
- Work Order No: {wo_number}
- Category: {category}
- Priority: {priority}
- Summary: {summary}

LOCATION:
- Area: {area}
- Address: {address}
- Coordinates: {coords_display}
{maps_text_line}

ASSIGNMENT SCHEDULE:
- Date: {assignment_date}
- Shift: {shift_name} ({shift_start} - {shift_end})

{f'INSTRUCTIONS: {instructions}' if instructions else ''}

Official hawkEYE Municipal Authority Work Order Notification.
"""

        # Build Responsive HTML Body
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090a0f; color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #131722; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }}
    .header {{ background: #0f172a; padding: 24px; text-align: center; border-bottom: 2px solid #f59e0b; }}
    .header h1 {{ margin: 0; color: #f59e0b; font-size: 22px; font-weight: 900; letter-spacing: 1px; }}
    .content {{ padding: 28px; }}
    .greeting {{ font-size: 18px; font-weight: bold; color: #f8fafc; margin-bottom: 12px; }}
    .lead {{ font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }}
    .badge-status {{ display: inline-block; background: {'#3b82f6' if is_reassigned else '#f59e0b'}; color: {'#ffffff' if is_reassigned else '#090a0f'}; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 11px; margin-bottom: 20px; }}
    .image-box {{ width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155; display: block; }}
    .details-card {{ background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }}
    .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #94a3b8; font-weight: 600; }}
    .val {{ color: #f8fafc; font-weight: 700; font-family: monospace; }}
    .badge-prio {{ background: #f59e0b; color: #090a0f; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; }}
    .btn-maps {{ display: block; width: 100%; text-align: center; background: #f59e0b; color: #090a0f; font-weight: 900; font-size: 14px; padding: 14px 0; border-radius: 12px; text-decoration: none; margin-top: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }}
    .instructions-box {{ background: #1c1917; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 20px; font-size: 13px; color: #fef08a; }}
    .footer {{ background: #0f172a; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HAWKEYE MUNICIPAL WORK ORDER</h1>
    </div>
    <div class="content">
      <div class="badge-status">{badge_text}</div>
      <div class="greeting">Hello {employee_name},</div>
      <div class="lead">{lead_text}</div>

      <img src="{image_url}" alt="Report Photo" class="image-box" />

      <div class="details-card">
        <div class="row"><span class="label">Ticket ID:</span><span class="val">{ticket_id}</span></div>
        <div class="row"><span class="label">Work Order No:</span><span class="val">{wo_number}</span></div>
        <div class="row"><span class="label">Category:</span><span class="val">{category}</span></div>
        <div class="row"><span class="label">Priority:</span><span class="badge-prio">{priority}</span></div>
        <div class="row"><span class="label">Summary:</span><span style="color:#e2e8f0;">{summary}</span></div>
      </div>

      <div class="details-card">
        <div style="font-weight:bold; color:#f59e0b; margin-bottom:10px; font-size:14px;">LOCATION DETAILS</div>
        <div class="row"><span class="label">Area / Zone:</span><span class="val">{area}</span></div>
        <div class="row"><span class="label">Address:</span><span style="color:#cbd5e1;">{address}</span></div>
        <div class="row"><span class="label">Coordinates:</span><span class="val">{coords_display}</span></div>

        {btn_maps_html}
      </div>

      <div class="details-card">
        <div style="font-weight:bold; color:#f59e0b; margin-bottom:10px; font-size:14px;">ASSIGNMENT TIMINGS</div>
        <div class="row"><span class="label">Assignment Date:</span><span class="val">{assignment_date}</span></div>
        <div class="row"><span class="label">Shift Name:</span><span class="val">{shift_name}</span></div>
        <div class="row"><span class="label">Duty Hours:</span><span class="val">{shift_start} – {shift_end}</span></div>
      </div>

      {f'<div class="instructions-box"><strong>Authority Instructions:</strong><br/>{instructions}</div>' if instructions else ''}
    </div>

    <div class="footer">
      This is an official hawkEYE municipal work assignment notification.<br/>
      Visakhapatnam Municipal Corporation Civic Operations Division.
    </div>
  </div>
</body>
</html>
"""

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Primary Delivery Path: Python Standard smtplib Delivery
        if has_smtp:
            try:
                msg = EmailMessage()
                msg["Subject"] = subject_title
                msg["From"] = smtp_email
                msg["To"] = employee_email

                msg.set_content(text_content)
                msg.add_alternative(html_content, subtype="html")

                logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port}...")
                with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                    server.starttls()
                    server.login(smtp_email, smtp_password)
                    server.send_message(msg)

                logger.info(f"Real SMTP work assignment email successfully sent TO worker officialEmail: '{employee_email}' (From: '{smtp_email}').")
                return {
                    "success": True,
                    "status": "SENT",
                    "sentAt": now_iso,
                    "failureReason": None,
                }
            except smtplib.SMTPAuthenticationError as auth_err:
                logger.error(f"SMTP authentication failed: {str(auth_err)}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "failureReason": "SMTP_AUTH_FAILED: Authentication rejected. Please verify SMTP_APP_PASSWORD.",
                }
            except (smtplib.SMTPConnectError, TimeoutError, OSError) as conn_err:
                logger.error(f"SMTP connection failed: {str(conn_err)}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "failureReason": "SMTP_CONNECTION_FAILED: Connection timeout or DNS failure to SMTP host.",
                }
            except smtplib.SMTPException as smtp_err:
                logger.error(f"SMTP send error: {str(smtp_err)}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "failureReason": f"EMAIL_SEND_FAILED: {str(smtp_err)}",
                }
            except Exception as exc:
                logger.error(f"Unexpected error during SMTP email send: {str(exc)}")
                return {
                    "success": False,
                    "status": "FAILED",
                    "failureReason": f"EMAIL_SEND_FAILED: {str(exc)}",
                }

        # Secondary Delivery Path: Resend API Fallback
        if has_resend:
            payload = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [employee_email],
                "subject": f"New hawkEYE Work Assignment — {ticket_id}",
                "html": html_content,
            }
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    msg_id = res_json.get("id", "resend_sent_id")
                    return {
                        "success": True,
                        "status": "SENT",
                        "sentAt": now_iso,
                        "providerMessageId": msg_id,
                        "failureReason": None,
                    }
            except Exception as exc:
                return {
                    "success": False,
                    "status": "FAILED",
                    "failureReason": str(exc),
                }

        return {
            "success": False,
            "status": "FAILED",
            "failureReason": "SMTP_NOT_CONFIGURED: Missing email configuration.",
        }

email_service = EmailService()
