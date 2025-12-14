import axios from 'axios';
import { supabase } from '../lib/supabase';

/**
 * SMS Gateway Service
 * Handles sending SMS via Android phone gateway
 */
class SMSGatewayService {
    constructor() {
        this.apiUrl = import.meta.env.VITE_SMS_GATEWAY_URL || '';
        this.apiKey = import.meta.env.VITE_SMS_GATEWAY_API_KEY || '';
        this.deviceId = import.meta.env.VITE_SMS_GATEWAY_DEVICE_ID || '';
        this.rateLimitMs = 1000; // 1 SMS per second
    }

    /**
     * Check if SMS gateway is configured
     */
    isConfigured() {
        return !!(this.apiUrl && this.apiKey && this.deviceId);
    }

    /**
     * Send single SMS
     */
    async sendSMS(phoneNumber, message) {
        if (!this.isConfigured()) {
            throw new Error('SMS Gateway not configured. Please set environment variables.');
        }

        try {
            const response = await axios.post(
                `${this.apiUrl}/message/send`,
                {
                    phone: phoneNumber,
                    message: message,
                    device: this.deviceId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                messageId: response.data.id || response.data.message_id,
                status: response.data.status || 'sent',
                data: response.data
            };
        } catch (error) {
            console.error('[SMSGateway] Send error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Send bulk SMS to multiple recipients
     */
    async sendBulkSMS(campaignId, recipients, message) {
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const recipient of recipients) {
            try {
                // Send SMS
                const result = await this.sendSMS(recipient.phone, message);

                // Log to database
                const { error } = await supabase
                    .from('sms_messages')
                    .insert({
                        campaign_id: campaignId,
                        phone_number: recipient.phone,
                        message: message,
                        status: result.success ? 'sent' : 'failed',
                        gateway_message_id: result.messageId,
                        error_message: result.error,
                        sent_at: result.success ? new Date().toISOString() : null
                    });

                if (error) {
                    console.error('[SMSGateway] Database error:', error);
                }

                results.push({
                    phone: recipient.phone,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                });

                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Rate limiting - wait between messages
                await this.sleep(this.rateLimitMs);

            } catch (error) {
                console.error(`[SMSGateway] Error sending to ${recipient.phone}:`, error);
                failCount++;
                results.push({
                    phone: recipient.phone,
                    success: false,
                    error: error.message
                });
            }
        }

        // Update campaign statistics
        await this.updateCampaignStats(campaignId);

        return {
            total: recipients.length,
            success: successCount,
            failed: failCount,
            results: results
        };
    }

    /**
     * Get message delivery status
     */
    async getMessageStatus(messageId) {
        if (!this.isConfigured()) {
            throw new Error('SMS Gateway not configured');
        }

        try {
            const response = await axios.get(
                `${this.apiUrl}/message/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.status,
                delivered: response.data.status === 'delivered',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update campaign statistics in database
     */
    async updateCampaignStats(campaignId) {
        try {
            const { error } = await supabase
                .rpc('update_campaign_stats', { p_campaign_id: campaignId });

            if (error) {
                console.error('[SMSGateway] Stats update error:', error);
            }
        } catch (error) {
            console.error('[SMSGateway] Stats update exception:', error);
        }
    }

    /**
     * Import contacts from CSV
     */
    async importContactsFromCSV(csvData) {
        const contacts = [];
        const lines = csvData.split('\n');

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [phone, name, email, tags] = line.split(',').map(s => s.trim());

            if (phone) {
                contacts.push({
                    phone_number: phone,
                    name: name || null,
                    email: email || null,
                    tags: tags ? tags.split(';') : [],
                    source: 'csv_import'
                });
            }
        }

        // Insert contacts
        const { data, error } = await supabase
            .from('sms_contacts')
            .upsert(contacts, { onConflict: 'phone_number' });

        if (error) {
            throw new Error(`Failed to import contacts: ${error.message}`);
        }

        return {
            imported: contacts.length,
            contacts: data
        };
    }

    /**
     * Get all contacts
     */
    async getContacts(filters = {}) {
        let query = supabase
            .from('sms_contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.opted_in !== undefined) {
            query = query.eq('opted_in', filters.opted_in);
        }

        if (filters.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch contacts: ${error.message}`);
        }

        return data;
    }

    /**
     * Helper: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new SMSGatewayService();
