// Server-only imports for email functionality
import nodemailer from 'nodemailer';
import { EmailTemplate } from './emailService';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailServiceConfig {
  provider: 'gmail' | 'brevo' | 'custom';
  smtp: SMTPConfig;
  fromEmail: string;
  fromName: string;
}

export class ProductionEmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static config: EmailServiceConfig | null = null;

  // Gmail SMTP Configuration (OAuth2)
  static getGmailConfig(email: string, appPassword?: string): EmailServiceConfig {
    // Check for OAuth2 credentials first
    const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_OAUTH_REFRESH_TOKEN;

    // If OAuth2 credentials are provided, use OAuth2
    if (clientId && clientSecret && refreshToken) {
      return {
        provider: 'gmail',
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: email,
            clientId: clientId,
            clientSecret: clientSecret,
            refreshToken: refreshToken,
          } as any,
        },
        fromEmail: email,
        fromName: process.env.FROM_NAME || 'Fitness Platform',
      };
    }

    // Fallback to App Password (if provided)
    if (appPassword) {
      return {
        provider: 'gmail',
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: email,
            pass: appPassword,
          },
        },
        fromEmail: email,
        fromName: process.env.FROM_NAME || 'Fitness Platform',
      };
    }

    throw new Error('Gmail requires either OAuth2 credentials or App Password');
  }

  // Brevo (formerly Sendinblue) SMTP Configuration
  static getBrevoConfig(email: string, apiKey: string): EmailServiceConfig {
    return {
      provider: 'brevo',
      smtp: {
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_LOGIN_EMAIL || email, // Use Brevo login email, not sender email
          pass: apiKey, // Use your Brevo SMTP key
        },
      },
      fromEmail: email,
      fromName: process.env.FROM_NAME || 'Fitness Platform',
    };
  }

  // Custom SMTP Configuration
  static getCustomConfig(
    host: string,
    port: number,
    email: string,
    password: string,
    secure = false
  ): EmailServiceConfig {
    return {
      provider: 'custom',
      smtp: {
        host,
        port,
        secure,
        auth: {
          user: email,
          pass: password,
        },
      },
      fromEmail: email,
      fromName: process.env.FROM_NAME || 'Fitness Platform',
    };
  }

  // Initialize email service based on environment variables
  static async initialize(): Promise<void> {
    const emailProvider = process.env.EMAIL_PROVIDER as 'gmail' | 'brevo' | 'custom';

    if (!emailProvider) {
      throw new Error('EMAIL_PROVIDER environment variable is required');
    }

    let config: EmailServiceConfig;

    switch (emailProvider) {
      case 'gmail':
        const gmailEmail = process.env.GMAIL_EMAIL;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        if (!gmailEmail || !gmailAppPassword) {
          throw new Error('GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables are required for Gmail');
        }

        config = this.getGmailConfig(gmailEmail, gmailAppPassword);
        break;

      case 'brevo':
        const brevoEmail = process.env.BREVO_EMAIL;
        const brevoApiKey = process.env.BREVO_API_KEY;

        if (!brevoEmail || !brevoApiKey) {
          throw new Error('BREVO_EMAIL and BREVO_API_KEY environment variables are required for Brevo');
        }

        config = this.getBrevoConfig(brevoEmail, brevoApiKey);
        break;

      case 'custom':
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const smtpEmail = process.env.SMTP_EMAIL;
        const smtpPassword = process.env.SMTP_PASSWORD;
        const smtpSecure = process.env.SMTP_SECURE === 'true';

        if (!smtpHost || !smtpEmail || !smtpPassword) {
          throw new Error('SMTP_HOST, SMTP_EMAIL, and SMTP_PASSWORD environment variables are required for custom SMTP');
        }

        config = this.getCustomConfig(smtpHost, smtpPort, smtpEmail, smtpPassword, smtpSecure);
        break;

      default:
        throw new Error(`Unsupported email provider: ${emailProvider}`);
    }

    this.config = config;
    this.transporter = nodemailer.createTransport(config.smtp);

    // Verify connection configuration
    try {
      await this.transporter.verify();
      console.log(`✅ ${config.provider} SMTP server is ready to take messages`);
    } catch (error) {
      console.error(`❌ ${config.provider} SMTP server connection failed:`, error);
      throw error;
    }
  }

  // Send email using the configured transporter
  static async sendEmail(emailTemplate: EmailTemplate): Promise<boolean> {
    if (!this.transporter || !this.config) {
      await this.initialize();
    }

    if (!this.transporter || !this.config) {
      throw new Error('Email service not properly initialized');
    }

    try {
      const mailOptions = {
        from: {
          name: this.config.fromName,
          address: this.config.fromEmail,
        },
        to: emailTemplate.to,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
        // Additional options for professional emails
        headers: {
          'X-Mailer': 'Fitness Platform v1.0',
          'X-Priority': '3', // Normal priority
        },
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent successfully via ${this.config.provider}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📤 To: ${emailTemplate.to}`);
      console.log(`📝 Subject: ${emailTemplate.subject}`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to send email via ${this.config.provider}:`, error);

      // Log specific error details for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if ('code' in error) {
          console.error('Error code:', error.code);
        }
      }

      return false;
    }
  }

  // Test email configuration
  static async testConfiguration(): Promise<boolean> {
    try {
      await this.initialize();

      const testTemplate: EmailTemplate = {
        to: this.config!.fromEmail, // Send test email to self
        subject: '🧪 Fitness Platform Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p><strong>Provider:</strong> ${this.config!.provider}</p>
          <p><strong>From:</strong> ${this.config!.fromName} &lt;${this.config!.fromEmail}&gt;</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p style="color: #666; font-size: 14px;">
            If you received this email, your ${this.config!.provider} configuration is working correctly!
          </p>
        `,
        text: `
          Email Service Test

          This is a test email to verify your email configuration is working correctly.

          Provider: ${this.config!.provider}
          From: ${this.config!.fromName} <${this.config!.fromEmail}>
          Time: ${new Date().toLocaleString()}

          If you received this email, your ${this.config!.provider} configuration is working correctly!
        `,
      };

      const success = await this.sendEmail(testTemplate);

      if (success) {
        console.log('🎉 Test email sent successfully! Check your inbox.');
      } else {
        console.log('❌ Test email failed to send.');
      }

      return success;
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      return false;
    }
  }

  // Send trainee invitation (wrapper for the original function)
  static async sendTraineeInvitation(
    traineeEmail: string,
    trainerName: string,
    traineeFirstName: string,
    invitationToken: string,
    baseUrl?: string
  ): Promise<boolean> {
    try {
      // Import the email template generator from the original service
      const { EmailService } = await import('./emailService');

      const emailTemplate = EmailService.generateInvitationEmail(
        traineeEmail,
        trainerName,
        traineeFirstName,
        invitationToken,
        baseUrl
      );

      return await this.sendEmail(emailTemplate);
    } catch (error) {
      console.error('Error sending trainee invitation:', error);
      return false;
    }
  }

  // Get current configuration info (for debugging)
  static getConfigInfo(): any {
    if (!this.config) {
      return { status: 'not initialized' };
    }

    return {
      provider: this.config.provider,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
      smtpHost: this.config.smtp.host,
      smtpPort: this.config.smtp.port,
      smtpSecure: this.config.smtp.secure,
      status: this.transporter ? 'ready' : 'not ready',
    };
  }
}