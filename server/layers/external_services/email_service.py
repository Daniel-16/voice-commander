import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

logger = logging.getLogger("external_services.email")

class EmailService:
    def __init__(self, smtp_server: str = None, smtp_port: int = None, 
                 username: str = None, password: str = None):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        
    async def send_email(self, 
                    recipient: str, 
                    subject: str, 
                    body: str, 
                    cc: Optional[List[str]] = None, 
                    bcc: Optional[List[str]] = None, 
                    is_html: bool = False) -> bool:
        """Send an email to the specified recipient"""
        if not all([self.smtp_server, self.smtp_port, self.username, self.password]):
            logger.error("SMTP configuration is incomplete")
            return False
            
        try:
            message = MIMEMultipart()
            message["From"] = self.username
            message["To"] = recipient
            message["Subject"] = subject
            
            if cc:
                message["Cc"] = ", ".join(cc)
            if bcc:
                message["Bcc"] = ", ".join(bcc)
                
            if is_html:
                message.attach(MIMEText(body, "html"))
            else:
                message.attach(MIMEText(body, "plain"))
                
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                recipients = [recipient]
                if cc:
                    recipients.extend(cc)
                if bcc:
                    recipients.extend(bcc)
                server.sendmail(self.username, recipients, message.as_string())
                
            logger.info(f"Email sent to {recipient}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False 