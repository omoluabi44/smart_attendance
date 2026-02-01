from api.v1.app import mail,app
from flask_mail import Mail, Message
from flask import render_template


def send_queue_verification_email( recipient, code):
    subject = "Verify your coursepass account"
    html_body = render_template("verification.html", code=code)
    msg = Message(subject=subject,recipients=[recipient],html=html_body)
    mail.send(msg)
    return 1