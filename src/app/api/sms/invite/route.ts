import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '../../../../lib/smsService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, trainerName, traineeFirstName, invitationToken } = await req.json();

    // Validate required fields
    if (!phoneNumber || !trainerName || !traineeFirstName || !invitationToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate Israeli phone number format (05XXXXXXXX)
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({
        error: 'Invalid phone number format. Must be 05XXXXXXXX (10 digits)'
      }, { status: 400 });
    }

    console.log('Attempting to send SMS invitation:', {
      phoneNumber,
      trainerName,
      traineeFirstName,
      hasToken: !!invitationToken,
      environment: process.env.NODE_ENV,
      smsProvider: process.env.SMS_PROVIDER || 'development (console only)'
    });

    // Send SMS invitation
    const success = await SMSService.sendTraineeInvitation(
      phoneNumber,
      trainerName,
      traineeFirstName,
      invitationToken
    );

    if (!success) {
      console.warn('SMS send failed, but returning success for graceful degradation');
      // In development or if SMS fails, we still return success
      // The email fallback will be triggered by the traineeService
      return NextResponse.json({
        ok: true,
        warning: 'SMS sending not configured or failed. Email fallback recommended.'
      });
    }

    console.log('SMS invitation sent successfully to:', phoneNumber);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('SMS invite API error:', err);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
