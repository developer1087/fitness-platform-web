// Email service for sending trainee invitations
// Note: In production, you would typically use a service like SendGrid, Mailgun, or AWS SES
// This is a mock implementation for demonstration purposes

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {

  // Generate invitation email template
  static generateInvitationEmail(
    traineeEmail: string,
    trainerName: string,
    traineeFirstName: string,
    invitationToken: string
  ): EmailTemplate {
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${invitationToken}`;

    const subject = `${trainerName} has invited you to join their fitness program`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fitness Program Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px 20px;
            border-radius: 0 0 10px 10px;
          }
          .cta-button {
            display: inline-block;
            background: #4f46e5;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏋️‍♀️ Fitness Program Invitation</h1>
        </div>

        <div class="content">
          <h2>Hi ${traineeFirstName}!</h2>

          <p><strong>${trainerName}</strong> has invited you to join their personalized fitness program.</p>

          <p>As part of this program, you'll get:</p>
          <ul>
            <li>Personalized workout plans</li>
            <li>Progress tracking and analytics</li>
            <li>Direct communication with your trainer</li>
            <li>Session scheduling and management</li>
          </ul>

          <p>To get started, click the button below to create your account:</p>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">
              Accept Invitation & Sign Up
            </a>
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            If the button doesn't work, you can also copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>

          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            This invitation will expire in 7 days. If you have any questions, please contact ${trainerName} directly.
          </p>
        </div>

        <div class="footer">
          <p>This invitation was sent by ${trainerName} through our Fitness Platform.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${traineeFirstName}!

      ${trainerName} has invited you to join their personalized fitness program.

      To get started, please visit this link to create your account:
      ${invitationUrl}

      This invitation will expire in 7 days.

      If you have any questions, please contact ${trainerName} directly.
    `;

    return {
      to: traineeEmail,
      subject,
      html,
      text
    };
  }

  // Send email (checks environment and uses appropriate service)
  static async sendEmail(emailTemplate: EmailTemplate): Promise<boolean> {
    try {
      const emailServiceType = process.env.EMAIL_SERVICE_TYPE;

      // Use production email service if configured
      if (emailServiceType === 'production') {
        const { ProductionEmailService } = await import('./productionEmailService');
        return await ProductionEmailService.sendEmail(emailTemplate);
      }

      // Fallback to mock implementation for development
      console.log('=== EMAIL SENDING (MOCK) ===');
      console.log('To:', emailTemplate.to);
      console.log('Subject:', emailTemplate.subject);
      console.log('Content (text):', emailTemplate.text);
      console.log('=== END EMAIL ===');

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;

    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send trainee invitation
  static async sendTraineeInvitation(
    traineeEmail: string,
    trainerName: string,
    traineeFirstName: string,
    invitationToken: string
  ): Promise<boolean> {
    try {
      const emailTemplate = this.generateInvitationEmail(
        traineeEmail,
        trainerName,
        traineeFirstName,
        invitationToken
      );

      return await this.sendEmail(emailTemplate);
    } catch (error) {
      console.error('Error sending trainee invitation:', error);
      return false;
    }
  }
}

// For production integration, here's a SendGrid example:
/*
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class ProductionEmailService {
  static async sendEmail(emailTemplate: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to: emailTemplate.to,
        from: process.env.FROM_EMAIL!, // Your verified sender
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid error:', error);
      return false;
    }
  }
}
*/