import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { socket } from '../services/socket.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Send, 
  Paperclip, 
  Search, 
  MessageSquare, 
  UserPlus, 
  ExternalLink, 
  AlertCircle, 
  Check, 
  CheckCheck, 
  Clock, 
  QrCode, 
  Loader2, 
  RefreshCw, 
  Phone,
  User,
  Plus,
  Volume2,
  Bell,
  X,
  FileText,
  Video,
  Music,
  Image as ImageIcon
} from 'lucide-react';

export default function WhatsAppInboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, leads, unassigned
  
  // Message input state
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Pagination states
  const [chatsPage, setChatsPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Sound and notifications preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Create Lead Modal State
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    whatsapp: '',
    requirements: '',
    source: 'manual_entry'
  });
  const [savingLead, setSavingLead] = useState(false);

  // View Lead Modal State (Simple Quick Details)
  const [showViewLeadModal, setShowViewLeadModal] = useState(false);

  // Ref references
  const messagesEndRef = useRef(null);
  const chatListRef = useRef(null);
  const messageBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  // Sync activeChat reference for WebSockets event handler
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Audio synthesize sound effect
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // Browser notifications alert
  const showDesktopNotification = (msgTitle, msgBody, chatId) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(msgTitle, {
        body: msgBody,
        icon: '/favicon.ico',
        tag: chatId
      });
      n.onclick = () => {
        window.focus();
        const chat = chats.find(c => c.chatId === chatId);
        if (chat) handleSelectChat(chat);
      };
    } catch (e) {
      console.warn('Desktop notification failed:', e);
    }
  };

  // Request browser notification permissions
  const handleEnableNotifications = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      });
    } else {
      setNotificationsEnabled(true);
    }
  };

  // Socket Connection and Event Listeners
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket.IO connected to server');
    });

    socket.on('whatsapp:status', (data) => {
      setStatus(data.status);
      setQrCode(data.qrCode);
      if (data.status !== 'CONNECTED') {
        setChats([]);
        setActiveChat(null);
        setMessages([]);
      } else {
        loadChats(1, true);
      }
    });

    socket.on('whatsapp:message_received', (msg) => {
      const currentActive = activeChatRef.current;
      
      // If message belongs to active chat, append it
      if (currentActive && msg.chatId === currentActive.chatId) {
        setMessages(current => {
          if (current.some(m => m.messageId === msg.messageId)) return current;
          return [...current, msg];
        });
        // Auto scroll to bottom
        setTimeout(scrollToBottom, 50);
        // Clear unread counts via API
        api.post(`/v1/whatsapp/chats/${currentActive.chatId}/read`).catch(console.error);
      }

      // Play alert sound if incoming message
      if (!msg.fromMe) {
        playNotificationSound();
        const senderName = msg.sender || 'WhatsApp Contact';
        showDesktopNotification(`New message from ${senderName}`, msg.body, msg.chatId);
      }
    });

    socket.on('whatsapp:chat_updated', (updatedChat) => {
      setChats(current => {
        const index = current.findIndex(c => c.chatId === updatedChat.chatId);
        if (index === -1) {
          return [updatedChat, ...current];
        }
        const copy = [...current];
        // Merge matching lead populated details
        copy[index] = { ...copy[index], ...updatedChat };
        // Sort descending by last message time
        return copy.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      });

      // Update active chat details if it is the one updated (e.g. unread count or lead status linked)
      const currentActive = activeChatRef.current;
      if (currentActive && updatedChat.chatId === currentActive.chatId) {
        setActiveChat(current => ({ ...current, ...updatedChat }));
      }
    });

    socket.on('whatsapp:message_ack', (data) => {
      const currentActive = activeChatRef.current;
      if (currentActive && data.chatId === currentActive.chatId) {
        setMessages(current => current.map(m => 
          m.messageId === data.messageId ? { ...m, status: data.status } : m
        ));
      }
    });

    // Check status on mount
    fetchStatus();

    return () => {
      socket.off('connect');
      socket.off('whatsapp:status');
      socket.off('whatsapp:message_received');
      socket.off('whatsapp:chat_updated');
      socket.off('whatsapp:message_ack');
      socket.disconnect();
    };
  }, []);

  // Poll status occasionally to keep in sync
  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/v1/whatsapp/status');
      setStatus(data.status);
      setQrCode(data.qrCode);
      if (data.status === 'CONNECTED') {
        loadChats(1, true);
      } else {
        setChats([]);
        setActiveChat(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to get status', err);
    }
  };

  // Note: Connection management moved to Integrations page

  // Load synced conversations
  const loadChats = async (page = 1, clear = false) => {
    setLoadingChats(true);
    try {
      const { data } = await api.get('/v1/whatsapp/chats', {
        params: {
          filter,
          search: searchQuery,
          page,
          limit: 30
        }
      });
      
      const newItems = data.items || [];
      if (clear) {
        setChats(newItems);
      } else {
        setChats(current => {
          const merged = [...current];
          newItems.forEach(item => {
            if (!merged.some(c => c.chatId === item.chatId)) {
              merged.push(item);
            }
          });
          return merged.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });
      }
      setChatsPage(page);
      setHasMoreChats(page < data.pages);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  // Reload chats when filter or search changes
  useEffect(() => {
    loadChats(1, true);
  }, [filter, searchQuery]);

  // Load message history for a conversation
  const loadMessages = async (chatId, page = 1, appendTop = false) => {
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/v1/whatsapp/chats/${chatId}/messages`, {
        params: { page, limit: 40 }
      });
      
      const newMessages = data.items || [];
      if (appendTop) {
        setMessages(current => [...newMessages, ...current]);
      } else {
        setMessages(newMessages);
        // Scroll to bottom on initial load
        setTimeout(scrollToBottom, 50);
      }
      setMessagesPage(page);
      setHasMoreMessages(page < data.pages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Infinite Scroll Handler for Older Messages
  const handleMessagesScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMoreMessages && !loadingMessages && activeChat) {
      // Save scroll height to adjust after loading
      const prevScrollHeight = e.target.scrollHeight;
      loadMessages(activeChat.chatId, messagesPage + 1, true).then(() => {
        // Adjust scroll position to prevent jumping
        setTimeout(() => {
          if (messageBodyRef.current) {
            messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight - prevScrollHeight;
          }
        }, 50);
      });
    }
  };

  // Infinite Scroll Handler for Conversations Sidebar
  const handleChatsScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
    if (bottom && hasMoreChats && !loadingChats) {
      loadChats(chatsPage + 1, false);
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    loadMessages(chat.chatId, 1, false);
    // Mark as read in backend
    api.post(`/v1/whatsapp/chats/${chat.chatId}/read`).catch(console.error);
    // Reset unread count locally
    setChats(current => current.map(c => 
      c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message submit
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChat || (!messageText.trim() && !selectedFile) || sending) return;

    setSending(true);
    setError('');
    
    // Create multipart form data payload
    const formData = new FormData();
    formData.append('chatId', activeChat.chatId);
    formData.append('message', messageText);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    // Optimistic message rendering
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      messageId: tempId,
      chatId: activeChat.chatId,
      fromMe: true,
      sender: user?.phone || 'crm',
      body: messageText || `[Media: ${selectedFile.name}]`,
      timestamp: new Date(),
      status: 'sending',
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'document') : 'chat'
    };

    setMessages(curr => [...curr, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    const prevMessageText = messageText;
    setMessageText('');
    removeSelectedFile();

    try {
      const { data } = await api.post('/v1/whatsapp/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update optimistic message with actual DB details
      setMessages(curr => curr.map(m => m.messageId === tempId ? data : m));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
      // Revert states
      setMessageText(prevMessageText);
      setMessages(curr => curr.filter(m => m.messageId !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Format timestamp helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date header helper
  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Open creation modal pre-filled
  const handleOpenCreateLead = () => {
    if (!activeChat) return;
    const phone = activeChat.phone;
    setLeadForm({
      companyName: activeChat.contactName || '',
      contactName: activeChat.contactName || '',
      phone: phone || '',
      email: '',
      whatsapp: phone || '',
      requirements: 'WhatsApp Inquiry',
      source: 'manual_entry'
    });
    setShowLeadModal(true);
  };

  // Save new lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSavingLead(true);
    setError('');
    try {
      const { data } = await api.post('/v1/leads', leadForm);
      setShowLeadModal(false);
      
      // Update linked lead state on activeChat
      const updatedChat = { 
        ...activeChat, 
        lead: {
          _id: data._id,
          companyName: data.companyName,
          contactName: data.contactName,
          status: data.status,
          phone: data.phone
        } 
      };
      
      setActiveChat(updatedChat);
      setChats(current => current.map(c => c.chatId === updatedChat.chatId ? updatedChat : c));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lead.');
    } finally {
      setSavingLead(false);
    }
  };

  // Render attachment icon based on mime type
  const renderAttachmentPreview = (url, mime) => {
    if (!url) return null;

    // Relative URLs should point to server base
    const base = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    const fullUrl = url.startsWith('http') ? url : `${base}${url}`;

    if (mime?.startsWith('image/')) {
      return (
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[280px] overflow-hidden rounded-lg border border-slate-200 mt-1 transition hover:opacity-90">
          <img src={fullUrl} alt="WhatsApp attachment" className="w-full h-auto object-cover max-h-[220px]" />
        </a>
      );
    }

    if (mime?.startsWith('audio/')) {
      return (
        <div className="mt-1">
          <audio controls className="w-full max-w-[260px] h-9">
            <source src={fullUrl} type={mime} />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    if (mime?.startsWith('video/')) {
      return (
        <div className="mt-1 max-w-[280px]">
          <video controls className="w-full rounded-lg max-h-[220px]">
            <source src={fullUrl} type={mime} />
          </video>
        </div>
      );
    }

    // Default document/PDF preview
    return (
      <a 
        href={fullUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-primary font-medium hover:bg-slate-100 transition mt-1"
      >
        <FileText size={16} />
        <span>Download Document</span>
        <ExternalLink size={12} className="text-slate-400" />
      </a>
    );
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm relative">
      
      {/* 1. Left Sidebar: Chats and Status */}
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        
        {/* Connection Status block */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
                status === 'QR_RECEIVED' ? 'bg-amber-500 animate-pulse' :
                status === 'DISCONNECTED' ? 'bg-rose-500' : 'bg-blue-500 animate-spin'
              }`} />
              <span className="text-xs font-bold text-slate-700">
                {status === 'CONNECTED' ? 'WhatsApp Connected' :
                 status === 'QR_RECEIVED' ? 'WhatsApp Link Required' :
                 status === 'DISCONNECTED' ? 'WhatsApp Disconnected' :
                 status === 'INITIALIZING' ? 'WhatsApp Connecting...' : 'Loading Session...'}
              </span>
            </div>
            {status !== 'CONNECTED' && (
              <Link 
                to="/integrations" 
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                Configure
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Preferences controls */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2 bg-slate-50/20 text-slate-500">
          <button 
            type="button" 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            title={soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
            className={`p-1.5 rounded-theme hover:bg-slate-100 ${soundEnabled ? 'text-primary' : 'text-slate-400'}`}
          >
            <Volume2 size={16} />
          </button>
          
          <button 
            type="button" 
            onClick={handleEnableNotifications} 
            title="Desktop Alerts"
            className={`p-1.5 rounded-theme hover:bg-slate-100 ${notificationsEnabled ? 'text-primary' : 'text-slate-400'}`}
          >
            <Bell size={16} />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-slate-100">
          <div className="input flex items-center gap-2">
            <Search size={15} className="text-slate-400" />
            <input 
              className="w-full border-0 bg-transparent p-0 text-xs outline-none focus:ring-0" 
              placeholder="Search chat or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-slate-100">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'leads', label: 'Leads' },
            { value: 'unassigned', label: 'Unassigned' }
          ].map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition shrink-0 ${
                filter === tab.value 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chats scrollable container */}
        <div 
          ref={chatListRef}
          onScroll={handleChatsScroll}
          className="flex-1 overflow-y-auto divide-y divide-slate-100"
        >
          {loadingChats && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            chats.map(chat => {
              const isActive = activeChat?.chatId === chat.chatId;
              const hasUnread = chat.unreadCount > 0;
              const initials = String(chat.contactName || chat.phone).slice(0, 2).toUpperCase();

              return (
                <button
                  key={chat.chatId}
                  type="button"
                  onClick={() => handleSelectChat(chat)}
                  className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-slate-50 ${
                    isActive ? 'bg-primary/5 hover:bg-primary/5' : ''
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    chat.lead ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {initials}
                  </div>

                  {/* Message Info preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`truncate text-xs font-bold text-slate-900 ${hasUnread ? 'font-extrabold' : ''}`}>
                        {chat.lead ? `${chat.lead.companyName} (${chat.contactName})` : chat.contactName}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {chat.phone}
                    </p>
                    <p className={`text-xs text-slate-500 mt-1 truncate ${hasUnread ? 'text-slate-900 font-medium' : ''}`}>
                      {chat.lastMessage || 'No messages'}
                    </p>
                  </div>

                  {/* Unread badge & Lead badge */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    {chat.lead && (
                      <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary">
                        Lead
                      </span>
                    )}
                    {hasUnread && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-extrabold text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
          {loadingChats && chats.length > 0 && (
            <div className="py-3 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto" size={16} />
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Window */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {activeChat ? (
          <>
            {/* Active chat header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-slate-900">
                    {activeChat.contactName}
                  </h2>
                  <span className="rounded bg-[#25D366]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#20ba59] flex items-center gap-0.5">
                    WhatsApp
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Phone size={11} /> {activeChat.phone}
                </p>
              </div>

              {/* Lead Link / Linking controls */}
              <div className="flex items-center gap-2">
                {activeChat.lead ? (
                  <div className="flex items-center gap-2 rounded-theme border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
                    <span className="font-bold">Lead Linked:</span>
                    <span className="truncate max-w-[120px]">{activeChat.lead.companyName}</span>
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {activeChat.lead.status}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowViewLeadModal(true)} 
                      className="hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <ExternalLink size={12} className="ml-1" /> View Lead
                    </button>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleOpenCreateLead}
                    variant="outline"
                    className="flex items-center gap-1.5 border-slate-200 h-9 px-3 text-xs"
                  >
                    <UserPlus size={14} />
                    Create Lead
                  </Button>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mx-5 mt-4 flex items-center gap-2 rounded-theme bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                <AlertCircle size={14} />
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Messages body history */}
            <div 
              ref={messageBodyRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50"
            >
              {loadingMessages && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs">Loading messages...</span>
                </div>
              ) : (
                <>
                  {hasMoreMessages && (
                    <div className="text-center py-2">
                      <span className="text-[10px] text-slate-400 font-bold">Scroll up to load older messages</span>
                    </div>
                  )}
                  {messages.map((msg, index) => {
                    const fromMe = msg.fromMe;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateHeader = !prevMsg || 
                      new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                    return (
                      <div key={msg.messageId || index} className="space-y-2">
                        {showDateHeader && (
                          <div className="flex justify-center my-3">
                            <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                              {formatDateHeader(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex w-full ${fromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs ${
                            fromMe 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/50'
                          }`}>
                            {/* Message text content */}
                            <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.body}</p>

                            {/* Media Attachment Preview */}
                            {msg.mediaUrl && renderAttachmentPreview(msg.mediaUrl, msg.mediaMimeType)}

                            {/* Time & Status footer */}
                            <div className={`flex items-center justify-end gap-1 text-[9px] mt-1.5 ${
                              fromMe ? 'text-primary-foreground/75' : 'text-slate-400'
                            }`}>
                              <span>{formatTime(msg.timestamp)}</span>
                              {fromMe && (
                                <span>
                                  {msg.status === 'sending' && <Clock size={10} className="animate-pulse" />}
                                  {msg.status === 'sent' && <Check size={10} />}
                                  {msg.status === 'delivered' && <CheckCheck size={10} />}
                                  {msg.status === 'read' && <CheckCheck size={10} className={fromMe ? 'text-[#25D366]' : 'text-blue-500'} />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Selected File Attachment bar */}
            {selectedFile && (
              <div className="mx-5 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={removeSelectedFile} className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input typing footer */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
              <div className="flex items-end gap-3">
                {/* File picker button */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>

                {/* Main typing area */}
                <div className="flex-1">
                  <textarea
                    rows="1"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    className="input min-h-10 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary max-h-32 overflow-y-auto"
                  />
                </div>

                {/* Send action button */}
                <button
                  type="submit"
                  disabled={sending || (!messageText.trim() && !selectedFile)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:bg-primary/95 hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:scale-100"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Blank state details window */
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 animate-bounce">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">WhatsApp Team Inbox</h3>
            <p className="mt-2 text-xs text-slate-500 max-w-sm">
              Integrate WhatsApp device connection to sync live messages. Click any conversation in the sidebar list to view history, reply, or link contacts with CRM Leads.
            </p>
            {status !== 'CONNECTED' && (
              <Link 
                to="/integrations"
                className="mt-5 rounded-theme bg-[#25D366] hover:bg-[#20ba59] text-white px-5 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <QrCode size={14} /> Go to Integrations to Connect
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 3. Modal Dialog: Create Lead Prefilled */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowLeadModal(false)}
              className="absolute right-4 top-4 h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <UserPlus size={18} className="text-primary" /> Create CRM Lead from Chat
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <Input 
                label="Lead / Company Name" 
                required 
                value={leadForm.companyName}
                onChange={(e) => setLeadForm(prev => ({ ...prev, companyName: e.target.value }))}
              />
              <Input 
                label="Primary Contact Name" 
                value={leadForm.contactName}
                onChange={(e) => setLeadForm(prev => ({ ...prev, contactName: e.target.value }))}
              />
              <Input 
                label="Phone Number" 
                required 
                value={leadForm.phone}
                onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Input 
                label="WhatsApp Number" 
                value={leadForm.whatsapp}
                onChange={(e) => setLeadForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
              <Input 
                label="Email Address" 
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Requirements</span>
                <textarea 
                  rows="2"
                  value={leadForm.requirements}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, requirements: e.target.value }))}
                  className="input focus:ring-primary focus:border-primary"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowLeadModal(false)}
                  className="rounded-theme border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={savingLead}>
                  {savingLead ? 'Saving...' : 'Save Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Dialog: View Lead Quick Info */}
      {showViewLeadModal && activeChat?.lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowViewLeadModal(false)}
              className="absolute right-4 top-4 h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <User size={18} className="text-primary" /> Lead Quick View
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lead / Company Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{activeChat.lead.companyName}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Primary Contact</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{activeChat.lead.contactName || '-'}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Phone / WhatsApp</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{activeChat.lead.phone}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lifecycle Status</p>
                <span className="inline-flex rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary mt-1">
                  {activeChat.lead.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-5">
              <button 
                type="button" 
                onClick={() => setShowViewLeadModal(false)}
                className="rounded-theme bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/95"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
