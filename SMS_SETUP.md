# SMS Invitation Setup Guide

## Overview

The Ryzup Fitness platform uses SMS as the **primary method** for trainee invitations. This guide explains how to configure SMS sending for different environments.

## Development vs Production

### Development Mode (Default)
- **No configuration required**
- SMS messages are logged to console only
- Perfect for testing without sending real SMS
- Automatically enabled when `NODE_ENV !== 'production'` or `SMS_PROVIDER` is not set

### Production Mode
- Requires SMS provider configuration
- Supports multiple providers: Twilio, AWS SNS
- Real SMS sent to trainee phone numbers

## SMS Provider Options

### Option 1: Twilio (Recommended)

**Pros:**
- Easy to set up
- Reliable delivery
- Good documentation
- Free trial credits available
- Israel SMS support

**Setup:**

1. **Create Twilio Account**
   - Go to https://www.twilio.com/try-twilio
   - Sign up for free trial (includes $15 credit)
   - Verify your phone number

2. **Get Credentials**
   - Account SID: Found on Twilio Console dashboard
   - Auth Token: Found on Twilio Console dashboard
   - Phone Number: Purchase from Twilio or use trial number

3. **Configure Environment Variables**
   ```bash
   # Add to .env.local or .env.production
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio number
   ```

4. **Enable Israel SMS**
   - Twilio Console → Messaging → Geographic Permissions
   - Enable Israel (+972)

**Pricing:**
- $0.0075 per SMS sent (Israel)
- Free trial: $15 credit (~2000 SMS)

### Option 2: AWS SNS

**Pros:**
- Part of AWS ecosystem
- Scalable
- Pay-as-you-go pricing

**Setup:**

1. **AWS Account Setup**
   - Create AWS account
   - Enable SNS service
   - Request production access for SMS (required)

2. **IAM Credentials**
   - Create IAM user with SNS permissions
   - Generate access key and secret

3. **Configure Environment Variables**
   ```bash
   SMS_PROVIDER=aws-sns
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

**Note:** AWS SNS implementation is currently a placeholder. Full SDK integration required.

## Testing SMS

### Development Testing (No SMS Sent)

```bash
# Start development server
npm run dev

# Invite a trainee via web dashboard
# Check console for SMS message:
```

Expected console output:
```
============================================================
📱 SMS INVITATION (DEVELOPMENT MODE)
============================================================
To: +972501234567
Message: Hi John! Your Trainer invited you to Ryzup Fitness...
Deep Link: ryzup://invite?token=abc123&phone=0501234567
Token: abc123
============================================================
```

### Production Testing (Real SMS)

1. **Configure Twilio** (see above)

2. **Set environment variables**
   ```bash
   # .env.production
   NODE_ENV=production
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=your_number
   ```

3. **Test with your own phone**
   - Invite yourself using your phone number
   - You should receive real SMS

4. **Verify in Twilio Console**
   - Twilio Console → Messaging → Logs
   - Check delivery status

## SMS Message Format

The invitation SMS includes:
- Personal greeting with trainee's first name
- Trainer's name
- App name (Ryzup Fitness)
- Deep link for mobile app
- Invitation token (embedded in link)

Example:
```
Hi Sarah! Mike Cohen invited you to Ryzup Fitness. Download the app and tap this link to join: ryzup://invite?token=abc123xyz&phone=0501234567
```

## Deep Link Configuration

### Mobile App Integration

The SMS contains a deep link: `ryzup://invite?token=XXX&phone=05XXXXXXXX`

When trainee taps the link:
1. Opens Ryzup mobile app (if installed)
2. OR redirects to App Store/Play Store (if not installed)
3. Pre-fills invitation token and phone number
4. Starts phone auth signup flow

### Deep Link Setup (iOS)

**File:** `apps/mobile/app.json`

```json
{
  "expo": {
    "scheme": "ryzup",
    "ios": {
      "associatedDomains": ["applinks:ryzup.me"]
    }
  }
}
```

### Deep Link Setup (Android)

Already configured in `app.json` via Expo scheme.

## Fallback to Email

If SMS fails or is not configured:
- System automatically sends email invitation (if email provided)
- Email contains web signup link as alternative
- Trainee can still join via email/password method

## Cost Estimation

### Twilio Pricing (Israel)
- Per SMS: $0.0075
- 100 invitations/month: $0.75
- 500 invitations/month: $3.75
- 1000 invitations/month: $7.50

### AWS SNS Pricing
- Per SMS: $0.0015 (lower than Twilio)
- But requires more setup and AWS account

## Security Best Practices

1. **Never commit credentials**
   - Use `.env.local` for development
   - Use environment variables in production
   - Add `.env*` to `.gitignore`

2. **Rate Limiting**
   - Twilio enforces rate limits automatically
   - Consider implementing server-side rate limiting

3. **Phone Number Validation**
   - API validates Israeli format (05XXXXXXXX)
   - Rejects invalid formats before SMS send

4. **Region Restrictions**
   - Limit to Israel (+972) to prevent abuse
   - Configure in Twilio Geographic Permissions

## Troubleshooting

### Issue: SMS not sending in development

**Solution:** This is expected behavior. Check console logs.

### Issue: Twilio "Unverified Number" error

**Solution:** Trial accounts can only send to verified numbers. Either:
- Verify recipient phone in Twilio Console
- OR upgrade to paid account

### Issue: "Invalid phone number format"

**Solution:** Ensure phone number is exactly 10 digits starting with 05
- Correct: `0501234567`
- Wrong: `+972501234567` (use local format)
- Wrong: `501234567` (missing leading 0)

### Issue: Deep link not working

**Solution:**
1. Check app scheme in `app.json` is set to `ryzup`
2. Rebuild mobile app after changing scheme
3. Test on physical device (simulators may not support deep links)

## Next Steps

1. ✅ SMS service implemented (development mode)
2. ⏳ Configure Twilio for production
3. ⏳ Test end-to-end invitation flow
4. ⏳ Set up mobile app deep link handling
5. ⏳ Monitor SMS delivery rates

## References

- **Twilio SMS API:** https://www.twilio.com/docs/sms/api
- **Expo Deep Linking:** https://docs.expo.dev/guides/linking/
- **Firebase Phone Auth:** https://firebase.google.com/docs/auth/android/phone-auth

---

**For implementation questions, see:**
- `/src/lib/smsService.ts` - SMS sending logic
- `/src/app/api/sms/invite/route.ts` - API route
- `/src/lib/traineeService.ts` - Integration point
