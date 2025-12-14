# OKASINA SMS Marketing - Setup Guide

## Quick Start (30 minutes)

### Step 1: Run Database Migration

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `hthkrbtwfymaxtnvshfz`
3. Click **SQL Editor**
4. Open file: `supabase/migrations/008_sms_marketing.sql`
5. Copy all SQL and paste into editor
6. Click **Run**
7. Verify: You should see 5 new tables created

**Tables Created**:
- `sms_campaigns` - Campaign management
- `sms_messages` - Individual message tracking
- `sms_contacts` - Contact database
- `sms_templates` - Message templates
- `sms_gateway_config` - Gateway settings

---

### Step 2: Set Up Android Phone

#### Option A: SMS Gateway API (Recommended)

**Download App**:
1. On Android phone, open Play Store
2. Search: "SMS Gateway API"
3. Install: [SMS Gateway for Android](https://play.google.com/store/apps/details?id=com.smsgateway)
4. Open app and create account

**Configure**:
1. Grant SMS permissions
2. Go to Settings → API
3. Copy your:
   - API URL (e.g., `https://smsgateway.me/api/v4`)
   - API Key
   - Device ID

#### Option B: Alternative Apps

**Other Options**:
- **SMS Forwarder** - Free, open source
- **Tasker + AutoRemote** - Advanced automation
- **HTTP SMS Gateway** - Self-hosted

---

### Step 3: Configure OKASINA

**Update `.env` file**:

```bash
# Add these lines to your .env file
VITE_SMS_GATEWAY_URL=https://smsgateway.me/api/v4
VITE_SMS_GATEWAY_API_KEY=your_api_key_here
VITE_SMS_GATEWAY_DEVICE_ID=your_device_id_here
```

**Update Vercel** (for production):
1. Go to Vercel project settings
2. Environment Variables
3. Add the same 3 variables
4. Redeploy

---

### Step 4: Test SMS Sending

#### Import Test Contacts

1. Create CSV file `test_contacts.csv`:
```csv
phone,name,email,tags
+260971234567,Test User 1,test1@example.com,test
+260977654321,Test User 2,test2@example.com,test
```

2. Go to OKASINA Admin → **SMS Marketing**
3. Click **Contacts** tab
4. Click **Import CSV**
5. Select your CSV file
6. Verify contacts imported

#### Send Test Campaign

1. Go to **Compose Campaign** tab
2. Campaign Name: "Test Campaign"
3. Message: "Hello! This is a test from OKASINA"
4. Select test contacts
5. Click **Send Campaign**
6. Check your phone - messages should send!

---

## Features Overview

### Campaign Composer
- Write messages (160 char limit)
- Select recipients
- Send immediately or schedule
- Track delivery status

### Contact Management
- Import from CSV
- Tag contacts
- Opt-in/opt-out tracking
- Search and filter

### Campaign History
- View all campaigns
- Delivery statistics
- Success/failure rates
- Message logs

---

## Integration with Orders

### Automatic Order Notifications

**Coming Soon**: Auto-send SMS when:
- Order placed
- Order shipped
- Order delivered

**To Enable** (requires additional code):
```javascript
// In order creation handler
import smsGatewayService from './services/smsGatewayService';

await smsGatewayService.sendSMS(
  customer.phone,
  `Thank you for your order #${orderNumber}!`
);
```

---

## Cost Analysis

### Using Android Phone + SIM Card

**Monthly Costs**:
- SIM card with unlimited SMS: ~$5-10
- SMS Gateway app (pro): ~$5
- **Total**: ~$10-15/month

**vs Commercial Services**:
- Twilio: $0.04 per SMS
- Africa's Talking: $0.02 per SMS
- 1000 SMS/month = $20-40

**Savings**: 50-75% cheaper!

---

## Troubleshooting

### Messages Not Sending

**Check**:
1. Android phone is connected to WiFi/data
2. SMS Gateway app is running
3. API credentials are correct in `.env`
4. Phone has SMS permission
5. SIM card has credit/plan

### "Gateway Not Configured" Error

**Fix**:
1. Verify `.env` variables are set
2. Restart development server
3. Check Vercel env vars for production

### Slow Sending

**Normal**: Rate limited to 1 SMS/second to avoid spam detection
**Adjust**: Change `rateLimitMs` in `smsGatewayService.js`

---

## CSV Import Format

**Required Format**:
```csv
phone,name,email,tags
+260971234567,John Doe,john@example.com,customer;vip
+260977654321,Jane Smith,jane@example.com,customer
```

**Notes**:
- Phone numbers must include country code (+260 for Zambia)
- Tags are semicolon-separated
- Name and email are optional

---

## Best Practices

### Message Content
- Keep under 160 characters
- Include opt-out instructions
- Personalize when possible
- Clear call-to-action

### Sending Schedule
- Avoid late night (10pm-8am)
- Best times: 10am-12pm, 2pm-5pm
- Test small batch first
- Monitor delivery rates

### Contact Management
- Regular list cleaning
- Honor opt-outs immediately
- Segment by tags
- Track engagement

---

## Next Steps

1. ✅ Run database migration
2. ✅ Set up Android phone
3. ✅ Configure environment variables
4. ✅ Import test contacts
5. ✅ Send test campaign
6. ⏳ Deploy to production
7. ⏳ Add order notifications
8. ⏳ Create message templates

---

## Support

**Issues?**
- Check phone app logs
- Verify API credentials
- Test with single SMS first
- Check Supabase logs

**Need Help?**
- SMS Gateway API docs: https://smsgateway.me/docs
- OKASINA support: info@okasinatrading.com

---

**You're ready to send bulk SMS!** 🚀
