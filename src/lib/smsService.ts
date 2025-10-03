/**
 * SMS Service for sending trainee invitations via SMS
 *
 * Development: Logs SMS to console
 * Production: Can be configured with Twilio, AWS SNS, or other SMS providers
 */

export class SMSService {
  /**
   * Send trainee invitation SMS
   * @param phoneNumber - Israeli phone number (05XXXXXXXX format)
   * @param trainerName - Name of the trainer sending the invitation
   * @param traineeFirstName - First name of the trainee
   * @param invitationToken - Unique invitation token
   * @param appUrl - Base URL for the mobile app deep link
   * @returns Promise<boolean> - true if SMS sent successfully
   */
  static async sendTraineeInvitation(
    phoneNumber: string,
    trainerName: string,
    traineeFirstName: string,
    invitationToken: string,
    appUrl: string = 'ryzup://invite'
  ): Promise<boolean> {
    try {
      // Format phone number to international format (+972XXXXXXXXX)
      const formattedPhone = phoneNumber.startsWith('+972')
        ? phoneNumber
        : `+972${phoneNumber.substring(1)}`;

      // Create deep link for mobile app
      const deepLink = `${appUrl}?token=${invitationToken}&phone=${phoneNumber}`;

      // SMS message text
      const message = `Hi ${traineeFirstName}! ${trainerName} invited you to Ryzup Fitness. Download the app and tap this link to join: ${deepLink}`;

      // Development mode: Log to console
      if (process.env.NODE_ENV !== 'production' || !process.env.SMS_PROVIDER) {
        console.log('='.repeat(60));
        console.log('📱 SMS INVITATION (DEVELOPMENT MODE)');
        console.log('='.repeat(60));
        console.log('To:', formattedPhone);
        console.log('Message:', message);
        console.log('Deep Link:', deepLink);
        console.log('Token:', invitationToken);
        console.log('='.repeat(60));

        // Return true to simulate successful send in development
        return true;
      }

      // Production mode: Use configured SMS provider
      const provider = process.env.SMS_PROVIDER;

      switch (provider) {
        case 'twilio':
          return await this.sendViaTwilio(formattedPhone, message);

        case 'aws-sns':
          return await this.sendViaAWSSNS(formattedPhone, message);

        case 'firebase':
          // Firebase doesn't have direct SMS API for invitations
          // This would require Firebase Functions + Twilio/other provider
          console.warn('Firebase SMS provider not yet implemented. Use Twilio or AWS SNS.');
          return false;

        default:
          console.error(`Unknown SMS provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  /**
   * Send SMS via Twilio
   * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   */
  private static async sendViaTwilio(to: string, message: string): Promise<boolean> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
        console.error('Missing Twilio credentials');
        return false;
      }

      // Twilio REST API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromPhone,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio error:', error);
        return false;
      }

      const data = await response.json();
      console.log('SMS sent via Twilio:', data.sid);
      return true;
    } catch (error) {
      console.error('Twilio send error:', error);
      return false;
    }
  }

  /**
   * Send SMS via AWS SNS
   * Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
   */
  private static async sendViaAWSSNS(to: string, message: string): Promise<boolean> {
    try {
      // AWS SNS SDK would go here
      // For now, this is a placeholder
      console.log('AWS SNS SMS sending not yet implemented');
      console.log('To:', to);
      console.log('Message:', message);

      // TODO: Implement AWS SNS SDK integration
      // const sns = new AWS.SNS({ region: process.env.AWS_REGION });
      // await sns.publish({ PhoneNumber: to, Message: message }).promise();

      return false;
    } catch (error) {
      console.error('AWS SNS send error:', error);
      return false;
    }
  }
}
