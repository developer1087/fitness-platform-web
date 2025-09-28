import { NextRequest, NextResponse } from 'next/server';
import { ProductionEmailService } from '../../../../lib/productionEmailService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { traineeEmail, trainerName, traineeFirstName, invitationToken } = await req.json();

    if (!traineeEmail || !trainerName || !traineeFirstName || !invitationToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current domain from the request
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const currentUrl = `${protocol}://${host}`;

    console.log('Using dynamic URL for invitation:', currentUrl);

    const provider = process.env.EMAIL_PROVIDER;
    if (!provider) {
      return NextResponse.json({ error: 'EMAIL_PROVIDER env var is not set' }, { status: 400 });
    }
    if (provider === 'brevo') {
      if (!process.env.BREVO_EMAIL || !process.env.BREVO_API_KEY) {
        return NextResponse.json({ error: 'BREVO_EMAIL or BREVO_API_KEY is missing' }, { status: 400 });
      }
    }
    if (provider === 'gmail') {
      if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return NextResponse.json({ error: 'GMAIL_EMAIL or GMAIL_APP_PASSWORD is missing' }, { status: 400 });
      }
    }

    console.log('Attempting to send email with config:', {
      provider,
      traineeEmail,
      trainerName,
      traineeFirstName,
      hasToken: !!invitationToken
    });

    const ok = await ProductionEmailService.sendTraineeInvitation(
      traineeEmail,
      trainerName,
      traineeFirstName,
      invitationToken,
      currentUrl
    );

    console.log('Email send result:', ok);

    if (!ok) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Invite email API error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


