import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Send, 
  LogOut, 
  Link2 
} from 'lucide-react';

export default function WhatsAppSettings() {
  const [status, setStatus] = useState('DISCONNECTED'); // DISCONNECTED, INITIALIZING, QR_RECEIVED, CONNECTED, LOADING
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Test Message Form State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from Common CRM!');
  const [sendingTest, setSendingTest] = useState(false);

  // Fetch status function
  async function fetchStatus() {
    try {
      const { data } = await api.get('/v1/whatsapp/status');
      setStatus(data.status);
      setQrCode(data.qrCode);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status', err);
    }
  }

  // Connect WhatsApp client
  async function handleConnect() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/v1/whatsapp/connect');
      setStatus('INITIALIZING');
      setSuccess('WhatsApp client starting. Please wait for the QR code...');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start WhatsApp client.');
    } finally {
      setLoading(false);
    }
  }

  // Disconnect WhatsApp client
  async function handleDisconnect() {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp? This will log out the session.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/v1/whatsapp/disconnect');
      setStatus('DISCONNECTED');
      setQrCode('');
      setSuccess('WhatsApp disconnected successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  // Send Test Message
  async function handleSendTest(e) {
    e.preventDefault();
    if (!testPhone) {
      setError('Please provide a test phone number.');
      return;
    }

    setSendingTest(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/v1/whatsapp/test', {
        phone: testPhone,
        message: testMessage
      });
      if (data.success) {
        setSuccess('Test message sent successfully!');
      } else {
        setError('Failed to send test message.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending test message.');
    } finally {
      setSendingTest(false);
    }
  }

  // Poll status on mount and transitions
  useEffect(() => {
    fetchStatus();
    
    // Poll status every 3 seconds to auto-detect QR updates, scans, and disconnects
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Integration</h1>
          <p className="text-sm text-slate-500">
            Configure and link your WhatsApp account using unofficial API to receive notifications for User creations, Task assignments, and Lead routing.
          </p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={fetchStatus} 
          className="flex items-center gap-2 border-slate-200"
        >
          <RefreshCw size={16} className={status === 'INITIALIZING' || status === 'LOADING' ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-theme bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-theme bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          <CheckCircle className="mt-0.5 shrink-0" size={18} />
          <div>{success}</div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Connection Status Panel */}
        <Card title="Connection Status" className="md:col-span-2">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {status === 'CONNECTED' ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-pulse">
                  <CheckCircle size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Connected</h3>
                  <p className="text-sm text-slate-500 mt-1">Your CRM is connected to WhatsApp and ready to send notifications.</p>
                </div>
                <div className="pt-4">
                  <Button 
                    type="button" 
                    onClick={handleDisconnect} 
                    disabled={loading}
                    className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 mx-auto"
                  >
                    <LogOut size={16} />
                    Disconnect WhatsApp
                  </Button>
                </div>
              </div>
            ) : status === 'INITIALIZING' || status === 'LOADING' ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Loader2 size={40} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {status === 'INITIALIZING' ? 'Initializing Client...' : 'Loading Session...'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Connecting to WhatsApp servers. Please wait a moment...
                  </p>
                </div>
              </div>
            ) : status === 'QR_RECEIVED' ? (
              <div className="space-y-4 w-full">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <QrCode size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Scan QR Code</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Scan the QR code below using your phone's WhatsApp:
                  </p>
                </div>
                
                {qrCode ? (
                  <div className="mx-auto max-w-[250px] border-4 border-slate-900 p-2 rounded-xl bg-white shadow-md">
                    <img src={qrCode} alt="WhatsApp Web QR Code" className="w-full h-auto" />
                  </div>
                ) : (
                  <div className="mx-auto flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-dashed border-slate-300">
                    <Loader2 size={32} className="animate-spin text-slate-400" />
                  </div>
                )}
                
                <div className="text-left max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 mt-4">
                  <p className="font-semibold text-slate-700">Instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open WhatsApp on your mobile phone.</li>
                    <li>Tap <b>Menu</b> (Android) or <b>Settings</b> (iPhone) and select <b>Linked Devices</b>.</li>
                    <li>Tap on <b>Link a Device</b>.</li>
                    <li>Point your phone screen to this QR code to scan it.</li>
                  </ol>
                </div>
                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleDisconnect} 
                    disabled={loading}
                    className="border-slate-200 mx-auto"
                  >
                    Cancel Connection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Link2 size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Disconnected</h3>
                  <p className="text-sm text-slate-500 mt-1">WhatsApp integration is currently inactive.</p>
                </div>
                <div className="pt-4">
                  <Button 
                    type="button" 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="bg-[#25D366] text-white hover:bg-[#20ba59] flex items-center gap-2 mx-auto font-medium"
                  >
                    <QrCode size={16} />
                    Connect WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Test Message Panel */}
        <Card title="Test Notification">
          <form onSubmit={handleSendTest} className="space-y-4">
            <p className="text-xs text-slate-500">
              Verify if the WhatsApp connection is working correctly by sending a test message.
            </p>
            
            <Input 
              label="Recipient Phone Number" 
              required
              value={testPhone} 
              onChange={(e) => setTestPhone(e.target.value)} 
              placeholder="e.g. 919876543210"
              disabled={status !== 'CONNECTED' || sendingTest}
            />
            
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Message</span>
              <textarea 
                rows="3"
                required
                value={testMessage} 
                onChange={(e) => setTestMessage(e.target.value)} 
                className="input py-2 focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Type test message here..."
                disabled={status !== 'CONNECTED' || sendingTest}
              />
            </label>

            <Button 
              type="submit" 
              disabled={status !== 'CONNECTED' || sendingTest} 
              className="w-full flex items-center justify-center gap-2"
            >
              {sendingTest ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Test Message
                </>
              )}
            </Button>
            
            {status !== 'CONNECTED' && (
              <p className="text-[11px] text-center text-amber-600 font-medium">
                Connect WhatsApp to enable test messaging.
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
