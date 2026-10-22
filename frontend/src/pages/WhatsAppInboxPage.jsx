
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Paperclip, Search, MessageSquare, UserPlus, ExternalLink, AlertCircle,
  Check, CheckCheck, Clock, QrCode, Loader2, Phone, Volume2, Bell, X, FileText, ArrowLeft, User,
} from 'lucide-react';
import { api } from '../api/client.js';
import { socket } from '../services/socket.js';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';


const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'leads', label: 'Leads' },
  { value: 'unassigned', label: 'Unassigned' },
];

const idOf = (v) => String(v?._id || v || '');
const byRecent = (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDateHeader = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ---------- Memoised pieces: re-render only when their own props change ---------- */

const ChatListItem = memo(function ChatListItem({ chat, isActive, showOwner, onSelect }) {
  const hasUnread = chat.unreadCount > 0;
  const initials = String(chat.contactName || chat.phone || '?').slice(0, 2).toUpperCase();
  const title = chat.lead ? `${chat.lead.companyName} (${chat.contactName})` : chat.contactName;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(chat)}
        aria-current={isActive ? 'true' : undefined}
        className={`flex w-full items-start gap-3 p-3.5 min-h-[64px] text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${isActive ? 'bg-primary/5' : ''}`}
      >
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${chat.lead ? 'bg-primary/10 text-slate-900' : 'bg-slate-100 text-slate-700'}`}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`truncate text-sm text-slate-900 ${hasUnread ? 'font-extrabold' : 'font-bold'}`}>{title}</p>
            <span className="text-xs text-slate-600 shrink-0">{formatTime(chat.lastMessageTime)}</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 truncate flex items-center justify-between gap-2">
            <span>{chat.phone}</span>
            {showOwner && chat.userId && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-800">
                {chat.userId.name || chat.userId.email}
              </span>
            )}
          </p>
          <p className={`text-sm mt-1 truncate ${hasUnread ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
            {chat.lastMessage || 'No messages'}
          </p>
        </div>

        <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-1">
          {chat.lead && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-slate-900">Lead</span>}
          {hasUnread && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[11px] font-extrabold text-white">
              <span aria-hidden="true">{chat.unreadCount}</span>
              <span className="sr-only">{chat.unreadCount} unread messages</span>
            </span>
          )}
        </div>
      </button>
    </li>
  );
});

function Attachment({ url, mime }) {
  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  if (mime?.startsWith('image/')) {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block max-w-full sm:max-w-[280px] overflow-hidden rounded-lg border border-slate-200 mt-1 hover:opacity-90">
        {/* PERF: lazy + async decode, explicit size reserves space (no layout shift) */}
        <img src={fullUrl} alt="WhatsApp attachment" loading="lazy" decoding="async" width="280" height="220" className="w-full h-auto object-cover max-h-[220px]" />
      </a>
    );
  }
  if (mime?.startsWith('audio/')) {
    return <audio controls preload="none" className="mt-1 w-full max-w-[260px] h-9"><source src={fullUrl} type={mime} /></audio>;
  }
  if (mime?.startsWith('video/')) {
    return <video controls preload="metadata" className="mt-1 w-full max-w-[280px] rounded-lg max-h-[220px]"><source src={fullUrl} type={mime} /></video>;
  }
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-300 p-2.5 text-xs text-slate-900 font-medium hover:bg-slate-100 mt-1">
      <FileText size={16} aria-hidden="true" />
      <span>Download attachment</span>
      <ExternalLink size={12} className="text-slate-600" aria-hidden="true" />
    </a>
  );
}

const STATUS_LABEL = { sending: 'Sending', sent: 'Sent', delivered: 'Delivered', read: 'Read' };

const MessageBubble = memo(function MessageBubble({ msg, showDate }) {
  const { fromMe } = msg;
  return (
    // PERF: off-screen bubbles skip layout/paint work (fewer long tasks on long chats)
    <div className="space-y-2" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 64px' }}>
      {showDate && (
        <div className="flex justify-center my-3">
          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">{formatDateHeader(msg.timestamp)}</span>
        </div>
      )}
      <div className={`flex w-full ${fromMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-sm text-sm ${fromMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'}`}>
          <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.body}</p>
          {msg.mediaUrl && <Attachment url={msg.mediaUrl} mime={msg.mediaMimeType} />}
          <div className={`flex items-center justify-end gap-1 text-[11px] mt-1 ${fromMe ? 'text-white' : 'text-slate-600'}`}>
            <span>{formatTime(msg.timestamp)}</span>
            {fromMe && (
              <span>
                {msg.status === 'sending' && <Clock size={11} className="motion-safe:animate-pulse" aria-hidden="true" />}
                {msg.status === 'sent' && <Check size={11} aria-hidden="true" />}
                {msg.status === 'delivered' && <CheckCheck size={11} aria-hidden="true" />}
                {msg.status === 'read' && <CheckCheck size={11} className="text-emerald-300" aria-hidden="true" />}
                <span className="sr-only">{STATUS_LABEL[msg.status] || ''}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const ListSkeleton = () => (
  <ul aria-hidden="true" className="divide-y divide-slate-100">
    {Array.from({ length: 7 }).map((_, i) => (
      <li key={i} className="flex gap-3 p-3.5">
        <div className="h-10 w-10 rounded-full bg-slate-100 motion-safe:animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded bg-slate-100 motion-safe:animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-slate-100 motion-safe:animate-pulse" />
        </div>
      </li>
    ))}
  </ul>
);

/* ------------------------------------ Page ------------------------------------ */

export default function WhatsAppInboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('DISCONNECTED');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const debouncedSearch = useDebounced(searchQuery, 300); // PERF: 1 request per pause, not per keystroke

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [chatsPage, setChatsPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [modal, setModal] = useState(null); // null | 'create' | 'view'
  const [leadForm, setLeadForm] = useState({ companyName: '', contactName: '', phone: '', email: '', whatsapp: '', requirements: '', source: 'manual_entry' });
  const [savingLead, setSavingLead] = useState(false);
  const [leadError, setLeadError] = useState('');
  const dialogRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messageBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const chatsAbort = useRef(null);
  const messagesReq = useRef(0);

  // Refs let long-lived socket handlers read fresh values without re-subscribing
  const activeChatRef = useRef(activeChat);
  const chatsRef = useRef(chats);
  const userRef = useRef(user);
  const soundRef = useRef(soundEnabled);
  const notifRef = useRef(notificationsEnabled);
  const loadChatsRef = useRef(null);
  const selectChatRef = useRef(null);
  activeChatRef.current = activeChat;
  chatsRef.current = chats;
  userRef.current = user;
  soundRef.current = soundEnabled;
  notifRef.current = notificationsEnabled;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const isMine = (ownerId) => {
    const me = idOf(userRef.current);
    return !ownerId || !me || ownerId === me || userRef.current?.role === 'super_admin';
  };

  /* ---------- data loading ---------- */

  const loadChats = useCallback(async (page = 1, clear = false) => {
    chatsAbort.current?.abort(); // cancel stale request when filter/search changes
    const ctrl = new AbortController();
    chatsAbort.current = ctrl;
    setLoadingChats(true);
    try {
      const { data } = await api.get('/v1/whatsapp/chats', {
        params: { filter, search: debouncedSearch, page, limit: 20 },
        signal: ctrl.signal,
      });
      const items = data.items || [];
      setChats((cur) => {
        if (clear) return items;
        const merged = [...cur];
        items.forEach((i) => merged.some((c) => c.chatId === i.chatId) || merged.push(i));
        return merged.sort(byRecent);
      });
      setChatsPage(page);
      setHasMoreChats(page < data.pages);
    } catch (err) {
      if (!isCanceled(err)) console.error('Failed to load chats:', err);
    } finally {
      if (chatsAbort.current === ctrl) setLoadingChats(false);
    }
  }, [filter, debouncedSearch]);
  loadChatsRef.current = loadChats;

  const applyStatus = useCallback((next) => {
    setStatus(next);
    if (next !== 'CONNECTED') {
      setChats([]);
      setActiveChat(null);
      setMessages([]);
      setLoadingChats(false);
    }
  }, []);

  // Single place that fetches the list (was 3 duplicate calls on first load)
  useEffect(() => {
    if (status === 'CONNECTED') loadChats(1, true);
  }, [status, loadChats]);

  const loadMessages = useCallback(async (chat, page = 1, appendTop = false) => {
    if (!chat) return;
    const req = ++messagesReq.current; // ignore out-of-order responses
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/v1/whatsapp/chats/${chat.chatId}/messages`, {
        params: { page, limit: 40, ownerId: chat.userId?._id || chat.userId },
      });
      if (req !== messagesReq.current) return;
      const items = data.items || [];
      setMessages((cur) => (appendTop ? [...items, ...cur] : items));
      if (!appendTop) requestAnimationFrame(scrollToBottom);
      setMessagesPage(page);
      setHasMoreMessages(page < data.pages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (req === messagesReq.current) setLoadingMessages(false);
    }
  }, [scrollToBottom]);

  const handleSelectChat = useCallback((chat) => {
    setActiveChat(chat);
    setMessages([]);
    setError('');
    loadMessages(chat, 1, false);
    api.post(`/v1/whatsapp/chats/${chat.chatId}/read`).catch(console.error);
    setChats((cur) => cur.map((c) => (c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c)));
  }, [loadMessages]);
  selectChatRef.current = handleSelectChat;

  /* ---------- sound + desktop notifications ---------- */

  const playNotificationSound = () => {
    if (!soundRef.current) return;
    try {
      // PERF: one shared AudioContext (creating one per message leaks and is capped by browsers)
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
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

  const showDesktopNotification = (title, body, chatId) => {
    if (!notifRef.current || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(title, { body, icon: '/favicon.ico', tag: chatId });
      n.onclick = () => {
        window.focus();
        const chat = chatsRef.current.find((c) => c.chatId === chatId);
        if (chat) selectChatRef.current?.(chat);
      };
    } catch (e) {
      console.warn('Desktop notification failed:', e);
    }
  };

  const handleEnableNotifications = () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return setNotificationsEnabled((v) => !v);
    Notification.requestPermission().then((p) => p === 'granted' && setNotificationsEnabled(true));
  };

  /* ---------- sockets (subscribed once) ---------- */

  useEffect(() => {
    // PERF: open the websocket after first paint so it doesn't compete with initial render
    const start = () => socket.connect();
    const idle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(start, { timeout: 1500 })
      : setTimeout(start, 300);

    const onStatus = (data) => {
      if (data.userId && data.userId !== userRef.current?._id) return;
      applyStatus(data.status);
    };

    const onMessage = (msg) => {
      if (!msg?.chatId) return;
      const owner = idOf(msg.userId);
      if (!isMine(owner)) return;

      const active = activeChatRef.current;
      const isActive = active && (active.chatId === msg.chatId || (active.phone && msg.chatId.startsWith(active.phone)));
      if (isActive) {
        setMessages((cur) => (cur.some((m) => m.messageId === msg.messageId) ? cur : [...cur, msg]));
        requestAnimationFrame(scrollToBottom);
        api.post(`/v1/whatsapp/chats/${active.chatId}/read`).catch(console.error);
      }

      setChats((cur) => {
        const i = cur.findIndex((c) => c.chatId === msg.chatId && (!owner || idOf(c.userId) === owner));
        if (i === -1) {
          loadChatsRef.current?.(1, true);
          return cur;
        }
        const copy = [...cur];
        copy[i] = {
          ...copy[i],
          lastMessage: msg.body || (msg.mediaUrl ? '[Media]' : ''),
          lastMessageTime: msg.timestamp || new Date().toISOString(),
          unreadCount: isActive ? 0 : (Number(copy[i].unreadCount) || 0) + (msg.fromMe ? 0 : 1),
        };
        return copy.sort(byRecent);
      });

      if (!msg.fromMe) {
        playNotificationSound();
        showDesktopNotification(`New message from ${msg.sender || 'WhatsApp Contact'}`, msg.body || 'New media attachment', msg.chatId);
      }
    };

    const onChatUpdated = (updated) => {
      if (!updated?.chatId) return;
      const owner = idOf(updated.userId);
      if (!isMine(owner)) return;
      setChats((cur) => {
        const i = cur.findIndex((c) => c.chatId === updated.chatId && (!owner || idOf(c.userId) === owner));
        if (i === -1) return [updated, ...cur];
        const copy = [...cur];
        copy[i] = { ...copy[i], ...updated };
        return copy.sort(byRecent);
      });
      if (activeChatRef.current?.chatId === updated.chatId) setActiveChat((cur) => ({ ...cur, ...updated }));
    };

    const onAck = (data) => {
      if (!data?.messageId || !isMine(idOf(data.userId))) return;
      const active = activeChatRef.current;
      if (active && (!data.chatId || data.chatId === active.chatId)) {
        setMessages((cur) => cur.map((m) => (m.messageId === data.messageId ? { ...m, status: data.status } : m)));
      }
    };

    socket.on('whatsapp:status', onStatus);
    socket.on('whatsapp:message_received', onMessage);
    socket.on('whatsapp:chat_updated', onChatUpdated);
    socket.on('whatsapp:message_ack', onAck);

    (async () => {
      try {
        const { data } = await api.get('/v1/whatsapp/status');
        applyStatus(data.status);
      } catch (err) {
        console.error('Failed to get status', err);
        setLoadingChats(false);
      }
    })();

    return () => {
      'cancelIdleCallback' in window ? window.cancelIdleCallback(idle) : clearTimeout(idle);
      socket.off('whatsapp:status', onStatus);
      socket.off('whatsapp:message_received', onMessage);
      socket.off('whatsapp:chat_updated', onChatUpdated);
      socket.off('whatsapp:message_ack', onAck);
      socket.disconnect();
      chatsAbort.current?.abort();
      audioCtxRef.current?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- handlers ---------- */

  const handleMessagesScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0 && hasMoreMessages && !loadingMessages && activeChat) {
      const prev = el.scrollHeight;
      loadMessages(activeChat, messagesPage + 1, true).then(() =>
        requestAnimationFrame(() => {
          if (messageBodyRef.current) messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight - prev;
        })
      );
    }
  };

  const handleChatsScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100 && hasMoreChats && !loadingChats) {
      loadChats(chatsPage + 1, false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChat || (!messageText.trim() && !selectedFile) || sending) return;

    setSending(true);
    setError('');

    const formData = new FormData();
    formData.append('chatId', activeChat.chatId);
    formData.append('message', messageText);
    if (selectedFile) formData.append('file', selectedFile);

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      messageId: tempId,
      chatId: activeChat.chatId,
      fromMe: true,
      sender: user?.phone || 'crm',
      body: messageText || `[Media: ${selectedFile.name}]`,
      timestamp: new Date(),
      status: 'sending',
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.startsWith('video/') ? 'video' : 'document') : 'chat',
    };
    setMessages((cur) => [...cur, optimistic]);
    requestAnimationFrame(scrollToBottom);

    const prevText = messageText;
    setMessageText('');
    removeSelectedFile();

    try {
      const { data } = await api.post('/v1/whatsapp/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages((cur) => cur.map((m) => (m.messageId === tempId ? data : m)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
      setMessageText(prevText);
      setMessages((cur) => cur.filter((m) => m.messageId !== tempId));
    } finally {
      setSending(false);
    }
  };

  const closeModal = useCallback(() => setModal(null), []);

  const handleOpenCreateLead = () => {
    if (!activeChat) return;
    const phone = activeChat.phone || '';
    setLeadForm({
      companyName: activeChat.contactName || '',
      contactName: activeChat.contactName || '',
      phone,
      email: '',
      whatsapp: phone,
      requirements: 'WhatsApp Inquiry',
      source: 'manual_entry',
    });
    setLeadError('');
    setModal('create');
  };

  const setLeadField = (key) => (e) => setLeadForm((p) => ({ ...p, [key]: e.target.value }));

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSavingLead(true);
    setLeadError('');
    try {
      const { data } = await api.post('/v1/leads', leadForm);
      const updated = {
        ...activeChat,
        lead: { _id: data._id, companyName: data.companyName, contactName: data.contactName, status: data.status, phone: data.phone },
      };
      setActiveChat(updated);
      setChats((cur) => cur.map((c) => (c.chatId === updated.chatId ? updated : c)));
      setModal(null);
    } catch (err) {
      setLeadError(err.response?.data?.message || 'Failed to create lead.');
    } finally {
      setSavingLead(false);
    }
  };

  // Modal a11y: Escape closes, focus moves into dialog and returns to the trigger afterwards
  useEffect(() => {
    if (!modal) return undefined;
    const trigger = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && closeModal();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus?.();
    };
  }, [modal, closeModal]);

  const isSuperAdmin = user?.role === 'super_admin';
  const statusMeta = {
    CONNECTED: ['bg-emerald-600 motion-safe:animate-pulse', 'WhatsApp connected'],
    QR_RECEIVED: ['bg-amber-500 motion-safe:animate-pulse', 'Scan QR code'],
    DISCONNECTED: ['bg-rose-600', 'WhatsApp disconnected'],
    INITIALIZING: ['bg-blue-600 motion-safe:animate-pulse', 'WhatsApp connecting…'],
  }[status] || ['bg-blue-600 motion-safe:animate-pulse', 'Loading session…'];

  /* ------------------------------------ UI ------------------------------------ */

  return (
    <>
      {/* Page H1 – always in the DOM, so the heading order is H1 → H2 → (dialogs H2) on every screen size */}
      <h1 className="sr-only">WhatsApp Inbox</h1>

      {/* dvh = real visible height on mobile browsers (address bar aware) */}
      <div className="relative flex h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] min-h-[420px] overflow-hidden md:rounded-2xl border-y md:border border-slate-200 bg-slate-50 shadow-sm">

        {/* ===== Sidebar: full width on phones, fixed 20–24rem from md up ===== */}
        <aside
          aria-label="Conversations"
          className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 shrink-0 flex-col border-r border-slate-200 bg-white`}
        >
          <h2 className="sr-only">Conversations</h2>

          <div className="border-b border-slate-100 bg-slate-50 p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2" role="status">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${statusMeta[0]}`} />
                <span className="text-xs font-bold text-slate-800">{statusMeta[1]}</span>
              </div>
              {status !== 'CONNECTED' && (
                <Link to="/integrations" className="text-xs font-bold text-slate-900 underline underline-offset-2 py-1">Configure</Link>
              )}
            </div>
            <Link
              to="/whatsapp-campaign"
              className="flex items-center justify-center w-full rounded-xl bg-primary/10 hover:bg-primary/15 text-slate-900 py-2 text-xs font-extrabold border border-primary/30"
            >
              WhatsApp Bulk Campaign Studio →
            </Link>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              aria-pressed={soundEnabled}
              aria-label="Notification sounds"
              title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
              className={`h-10 w-10 flex items-center justify-center rounded-theme hover:bg-slate-100 ${soundEnabled ? 'text-slate-900' : 'text-slate-600'}`}
            >
              <Volume2 size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleEnableNotifications}
              aria-pressed={notificationsEnabled}
              aria-label="Desktop alerts"
              title="Desktop alerts"
              className={`h-10 w-10 flex items-center justify-center rounded-theme hover:bg-slate-100 ${notificationsEnabled ? 'text-slate-900' : 'text-slate-600'}`}
            >
              <Bell size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-100">
            <label htmlFor="chat-search" className="sr-only">Search chat or phone</label>
            <div className="input flex items-center gap-2">
              <Search size={16} className="text-slate-600" aria-hidden="true" />
              <input
                id="chat-search"
                type="search"
                className="w-full border-0 bg-transparent p-0 text-base md:text-sm outline-none focus:ring-0 placeholder:text-slate-500"
                placeholder="Search chat or phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-100" role="group" aria-label="Filter conversations">
            {FILTERS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                aria-pressed={filter === tab.value}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold shrink-0 ${filter === tab.value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div onScroll={handleChatsScroll} className="flex-1 overflow-y-auto overscroll-contain">
            {loadingChats && chats.length === 0 ? (
              <ListSkeleton />
            ) : chats.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-600">
                {status === 'CONNECTED' ? 'No conversations found.' : 'Connect WhatsApp to see conversations.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {chats.map((chat) => (
                  <ChatListItem
                    key={`${chat.chatId}-${idOf(chat.userId)}`}
                    chat={chat}
                    isActive={activeChat?.chatId === chat.chatId}
                    showOwner={isSuperAdmin}
                    onSelect={handleSelectChat}
                  />
                ))}
              </ul>
            )}
            {loadingChats && chats.length > 0 && (
              <div className="py-3 text-center text-slate-600" role="status">
                <Loader2 className="motion-safe:animate-spin mx-auto" size={16} aria-hidden="true" />
                <span className="sr-only">Loading more conversations</span>
              </div>
            )}
          </div>
        </aside>

        {/* ===== Chat window: hidden on phones until a chat is opened ===== */}
        <section aria-label="Conversation" className={`${activeChat ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-slate-50`}>
          {activeChat ? (
            <>
              <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 sm:px-5 py-2.5 sm:py-3">
                <button
                  type="button"
                  onClick={() => setActiveChat(null)}
                  aria-label="Back to conversations"
                  className="md:hidden h-11 w-11 -ml-1 flex items-center justify-center rounded-full text-slate-800 hover:bg-slate-100"
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-900">{activeChat.contactName}</h2>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">WhatsApp</span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} aria-hidden="true" /> {activeChat.phone}
                  </p>
                </div>

                <div className="w-full sm:w-auto">
                  {activeChat.lead ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-theme border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-slate-900">
                      <span className="font-bold">Lead linked:</span>
                      <span className="truncate max-w-[140px]">{activeChat.lead.companyName}</span>
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">{activeChat.lead.status}</span>
                      <button type="button" onClick={() => setModal('view')} className="ml-auto sm:ml-1 inline-flex items-center gap-1 font-bold underline underline-offset-2 py-1">
                        <ExternalLink size={12} aria-hidden="true" /> View lead
                      </button>
                    </div>
                  ) : (
                    <Button type="button" onClick={handleOpenCreateLead} variant="outline" className="flex w-full sm:w-auto items-center justify-center gap-1.5 border-slate-300 h-10 px-3 text-xs">
                      <UserPlus size={14} aria-hidden="true" /> Create lead
                    </Button>
                  )}
                </div>
              </header>

              {error && (
                <div role="alert" className="mx-3 sm:mx-5 mt-3 flex items-center gap-2 rounded-theme bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{error}</span>
                  <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto h-8 w-8 flex items-center justify-center text-red-800 hover:bg-red-100 rounded-full">
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              <div
                ref={messageBodyRef}
                onScroll={handleMessagesScroll}
                role="log"
                aria-live="polite"
                aria-label="Messages"
                className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 space-y-3 sm:space-y-4"
              >
                {loadingMessages && messages.length === 0 ? (
                  <Loader label="Loading messages" className="h-full" />
                ) : (
                  <>
                    {hasMoreMessages && (
                      <p className="text-center py-2 text-xs text-slate-600 font-bold">Scroll up to load older messages</p>
                    )}
                    {messages.map((msg, i) => {
                      const prev = i > 0 ? messages[i - 1] : null;
                      const showDate = !prev || new Date(msg.timestamp).toDateString() !== new Date(prev.timestamp).toDateString();
                      return <MessageBubble key={msg.messageId || i} msg={msg} showDate={showDate} />;
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {selectedFile && (
                <div className="mx-3 sm:mx-5 mb-2 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-slate-900"><FileText size={20} aria-hidden="true" /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={removeSelectedFile} aria-label="Remove attachment" className="h-10 w-10 shrink-0 text-slate-700 hover:bg-slate-100 rounded-full flex items-center justify-center">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-2.5 sm:p-4 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2 sm:gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && setSelectedFile(e.target.files[0])} className="hidden" tabIndex={-1} aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
                  >
                    <Paperclip size={18} aria-hidden="true" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <label htmlFor="message-input" className="sr-only">Type a message</label>
                    <textarea
                      id="message-input"
                      rows="1"
                      placeholder="Type a message…"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      /* text-base on phones stops iOS Safari zooming the page on focus */
                      className="input min-h-11 py-2.5 text-base md:text-sm placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary max-h-32 overflow-y-auto"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || (!messageText.trim() && !selectedFile)}
                    aria-label="Send message"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/95 active:scale-95 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none"
                  >
                    <Send size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-primary/10 text-slate-900 mb-4">
                <MessageSquare size={44} aria-hidden="true" />
              </div>
              {/* H2 (was H3 with no H1/H2 above it) */}
              <h2 className="text-lg font-bold text-slate-900">WhatsApp team inbox</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-sm">
                Connect a WhatsApp device to sync live messages. Pick a conversation to read history, reply, or link the contact to a CRM lead.
              </p>
              {status !== 'CONNECTED' && (
                <Link to="/integrations" className="mt-5 rounded-theme bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-sm font-bold flex items-center gap-1.5 shadow-sm">
                  <QrCode size={16} aria-hidden="true" /> Go to Integrations to connect
                </Link>
              )}
            </div>
          )}
        </section>

        {modal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
            onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-dialog-title"
              tabIndex={-1}
              className={`relative w-full ${modal === 'create' ? 'max-w-md' : 'max-w-sm'} max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-100 outline-none pb-[max(1.25rem,env(safe-area-inset-bottom))]`}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="absolute right-3 top-3 h-11 w-11 sm:h-9 sm:w-9 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={18} aria-hidden="true" />
              </button>

              {modal === 'create' && (
                <>
                  <h2 id="lead-dialog-title" className="text-base font-bold text-slate-900 mb-4 pr-10 flex items-center gap-1.5">
                    <UserPlus size={18} className="text-slate-900" aria-hidden="true" /> Create CRM lead from chat
                  </h2>
                  {leadError && (
                    <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                      <AlertCircle size={14} aria-hidden="true" /> {leadError}
                    </div>
                  )}
                  <form onSubmit={handleCreateLead} className="space-y-4">
                    <Input label="Lead / Company name" required value={leadForm.companyName} onChange={setLeadField('companyName')} />
                    <Input label="Primary contact name" value={leadForm.contactName} onChange={setLeadField('contactName')} />
                    <Input label="Phone number" required inputMode="tel" value={leadForm.phone} onChange={setLeadField('phone')} />
                    <Input label="WhatsApp number" inputMode="tel" value={leadForm.whatsapp} onChange={setLeadField('whatsapp')} />
                    <Input label="Email address" type="email" value={leadForm.email} onChange={setLeadField('email')} />
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Requirements</span>
                      <textarea rows="2" value={leadForm.requirements} onChange={setLeadField('requirements')} className="input text-base sm:text-sm focus:ring-primary focus:border-primary" />
                    </label>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
                      <button type="button" onClick={closeModal} className="rounded-theme border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 bg-white">
                        Cancel
                      </button>
                      <Button type="submit" disabled={savingLead}>{savingLead ? 'Saving…' : 'Save lead'}</Button>
                    </div>
                  </form>
                </>
              )}

              {modal === 'view' && activeChat?.lead && (
                <>
                  <h2 id="lead-dialog-title" className="text-base font-bold text-slate-900 mb-4 pr-10 flex items-center gap-1.5">
                    <User size={18} className="text-slate-900" aria-hidden="true" /> Lead quick view
                  </h2>
                  <dl className="space-y-3.5 text-sm">
                    {[
                      ['Lead / Company name', activeChat.lead.companyName],
                      ['Primary contact', activeChat.lead.contactName || '-'],
                      ['Phone / WhatsApp', activeChat.lead.phone],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-slate-600 font-semibold">{label}</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">{value}</dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-xs text-slate-600 font-semibold">Lifecycle status</dt>
                      <dd className="mt-1">
                        <span className="inline-flex rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-slate-900">{activeChat.lead.status}</span>
                      </dd>
                    </div>
                  </dl>
                  <div className="flex justify-end pt-4 border-t border-slate-100 mt-5">
                    <button type="button" onClick={closeModal} className="rounded-theme bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/95">Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}




