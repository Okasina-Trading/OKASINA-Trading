import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import smsGatewayService from '../../services/smsGatewayService';
import { Send, Users, FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SMSMarketingPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [message, setMessage] = useState('');
    const [campaignName, setCampaignName] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('compose'); // compose, campaigns, contacts

    useEffect(() => {
        loadCampaigns();
        loadContacts();
    }, []);

    const loadCampaigns = async () => {
        const { data, error } = await supabase
            .from('sms_campaign_summary')
            .select('*')
            .limit(20);

        if (!error && data) {
            setCampaigns(data);
        }
    };

    const loadContacts = async () => {
        try {
            const data = await smsGatewayService.getContacts({ opted_in: true });
            setContacts(data);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    };

    const handleSendCampaign = async () => {
        if (!campaignName || !message || selectedContacts.length === 0) {
            alert('Please fill in campaign name, message, and select recipients');
            return;
        }

        setLoading(true);

        try {
            // Create campaign
            const { data: campaign, error: campaignError } = await supabase
                .from('sms_campaigns')
                .insert({
                    name: campaignName,
                    message: message,
                    status: 'sending',
                    total_recipients: selectedContacts.length,
                    created_by: 'admin'
                })
                .select()
                .single();

            if (campaignError) throw campaignError;

            // Send bulk SMS
            const recipients = selectedContacts.map(id => {
                const contact = contacts.find(c => c.id === id);
                return { phone: contact.phone_number, name: contact.name };
            });

            const result = await smsGatewayService.sendBulkSMS(
                campaign.id,
                recipients,
                message
            );

            // Update campaign status
            await supabase
                .from('sms_campaigns')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', campaign.id);

            alert(`Campaign sent! ${result.success} successful, ${result.failed} failed`);

            // Reset form
            setCampaignName('');
            setMessage('');
            setSelectedContacts([]);
            loadCampaigns();

        } catch (error) {
            console.error('Campaign error:', error);
            alert(`Failed to send campaign: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvData = e.target.result;
                const result = await smsGatewayService.importContactsFromCSV(csvData);
                alert(`Imported ${result.imported} contacts`);
                loadContacts();
            } catch (error) {
                alert(`Import failed: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };

    const toggleContactSelection = (contactId) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const selectAllContacts = () => {
        setSelectedContacts(contacts.map(c => c.id));
    };

    const clearSelection = () => {
        setSelectedContacts([]);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">SMS Marketing</h1>
                <p className="text-gray-600">Send bulk SMS campaigns to your customers</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`pb-2 px-4 ${activeTab === 'compose' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                >
                    <Send className="inline w-4 h-4 mr-2" />
                    Compose Campaign
                </button>
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`pb-2 px-4 ${activeTab === 'campaigns' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                >
                    <FileText className="inline w-4 h-4 mr-2" />
                    Campaigns ({campaigns.length})
                </button>
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`pb-2 px-4 ${activeTab === 'contacts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                >
                    <Users className="inline w-4 h-4 mr-2" />
                    Contacts ({contacts.length})
                </button>
            </div>

            {/* Compose Tab */}
            {activeTab === 'compose' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Message Composer */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Compose Message</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Campaign Name</label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="e.g., New Product Launch"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Message ({message.length}/160 characters)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full border rounded px-3 py-2 h-32"
                                placeholder="Type your message here..."
                                maxLength={160}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                SMS messages are limited to 160 characters
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Recipients ({selectedContacts.length} selected)
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllContacts}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSendCampaign}
                            disabled={loading || !campaignName || !message || selectedContacts.length === 0}
                            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Clock className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Campaign
                                </>
                            )}
                        </button>
                    </div>

                    {/* Contact Selection */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Select Recipients</h2>

                        <div className="max-h-96 overflow-y-auto">
                            {contacts.map(contact => (
                                <div
                                    key={contact.id}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => toggleContactSelection(contact.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedContacts.includes(contact.id)}
                                        onChange={() => { }}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium">{contact.name || 'No name'}</div>
                                        <div className="text-sm text-gray-600">{contact.phone_number}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {campaigns.map(campaign => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{campaign.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded ${campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{campaign.total_recipients}</td>
                                    <td className="px-6 py-4 text-green-600">{campaign.delivered_count}</td>
                                    <td className="px-6 py-4 text-red-600">{campaign.failed_count}</td>
                                    <td className="px-6 py-4">{campaign.delivery_rate}%</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(campaign.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
                <div>
                    <div className="mb-4 flex gap-4">
                        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleImportCSV}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={loadContacts}
                            className="border px-4 py-2 rounded hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {contacts.map(contact => (
                                    <tr key={contact.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{contact.name || '-'}</td>
                                        <td className="px-6 py-4">{contact.phone_number}</td>
                                        <td className="px-6 py-4">{contact.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            {contact.tags?.map(tag => (
                                                <span key={tag} className="inline-block bg-gray-100 px-2 py-1 text-xs rounded mr-1">
                                                    {tag}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.opted_in ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
