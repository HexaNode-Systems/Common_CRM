import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { X, 
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Filter,
  ArrowLeft,
  ChevronsUpDown
} from 'lucide-react';

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Filters and Search (search waits until typing pauses)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals / Creating Ticket
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium'
  });

  // Reply message
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // For support staff to assign tickets
  const [staffUsers, setStaffUsers] = useState([]);
  const chatEndRef = useRef(null);

  // Support staff = Full access on Support Desk; the server says who that is.
  const isStaff = canManage;

  // Fetch Tickets
  const fetchTickets = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/support/tickets', { params });
      setTickets(res.data.items || []);
      setCanManage(Boolean(res.data.canManage));
      if (!quiet) setError('');
    } catch (err) {
      if (!quiet) setError(err.response?.data?.message || 'Unable to load support tickets.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Fetch staff users for assignment dropdown
  // People with Support Desk access who can take tickets (loaded once, staff only).
  const fetchStaff = async () => {
    try {
      const res = await api.get('/support/tickets/agents');
      setStaffUsers(res.data.items || []);
    } catch {
      setStaffUsers([]);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    if (canManage && !staffUsers.length) fetchStaff();
  }, [canManage]);

  // Live updates: refresh the list and the open ticket every 15 seconds while the tab is visible.
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedTicket?._id || null;
  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      fetchTickets({ quiet: true });
      const id = selectedIdRef.current;
      if (!id) return;
      try {
        const res = await api.get(`/support/tickets/${id}`);
        if (selectedIdRef.current === id) setSelectedTicket(res.data);
      } catch { /* keep what is shown */ }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  // Scroll to bottom when new messages load or selected ticket changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Handle Select Ticket
  const handleSelectTicket = async (ticketId) => {
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to open this ticket.');
    }
  };

  // Handle Create Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      setCreateError('Title and description are required.');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const res = await api.post('/support/tickets', newTicket);
      setTickets([res.data, ...tickets]);
      setIsCreateOpen(false);
      setNewTicket({
        title: '',
        description: '',
        category: 'General',
        priority: 'Medium'
      });
      setSelectedTicket(res.data);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Unable to create the ticket.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (ticketId, nextStatus) => {
    try {
      const res = await api.patch(`/support/tickets/${ticketId}/status`, { status: nextStatus });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => (t._id === ticketId ? res.data : t)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change the status.');
    }
  };

  // Handle Assign Ticket
  const handleAssignTicket = async (ticketId, staffId) => {
    try {
      const res = await api.patch(`/support/tickets/${ticketId}/assign`, { assignedTo: staffId || null });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => (t._id === ticketId ? res.data : t)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign the ticket.');
    }
  };

  // Handle Send Reply/Message
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setReplyLoading(true);
      const res = await api.post(`/support/tickets/${selectedTicket._id}/messages`, { message: replyMessage });
      setSelectedTicket(res.data);
      setReplyMessage('');
      setTickets(tickets.map(t => (t._id === selectedTicket._id ? res.data : t)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send the reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  // Helper formatting values
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Desk</h1>
          <p className="text-sm text-slate-500">Raise support tickets and track progress. Updates refresh every 15 seconds.</p>
        </div>
        <Button onClick={() => { setCreateError(''); setIsCreateOpen(true); }} className="flex items-center gap-2 bg-primary text-white">
          <Plus size={16} />
          Create Support Ticket
        </Button>
      </div>

      {error ? (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-xs font-semibold underline">Dismiss</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Tickets List */}
        <div className={`space-y-4 lg:col-span-1 ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket ID or details..."
                maxLength={100}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 focus:border-primary focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 focus:border-primary focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm">No support tickets found.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => handleSelectTicket(ticket._id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                    selectedTicket?._id === ticket._id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500">{ticket.ticketId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-800 line-clamp-1">{ticket.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 text-2xs text-slate-400">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Active Ticket Thread */}
        <div className={`lg:col-span-2 ${!selectedTicket ? 'hidden lg:block' : 'block'}`}>
          {selectedTicket ? (
            <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden h-[75vh]">
              {/* Header */}
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden p-1 rounded-full hover:bg-slate-200 text-slate-500"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{selectedTicket.ticketId}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-2xs font-semibold ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                      <span className="text-xs text-slate-500">({selectedTicket.category})</span>
                    </div>
                    <h2 className="mt-0.5 text-base font-semibold text-slate-900">{selectedTicket.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status: only the changes this person is allowed to make */}
                  {(() => {
                    const allowed = (selectedTicket.allowedStatuses || []).filter((st) => st !== selectedTicket.status);
                    if (isStaff) {
                      return (
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value)}
                          aria-label="Ticket status"
                          className={`rounded-xl border px-3 py-1.5 text-xs font-medium focus:outline-none ${getStatusBadgeClass(selectedTicket.status)}`}
                        >
                          {['Open', 'In Progress', 'Resolved', 'Closed'].map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                        {allowed.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(selectedTicket._id, st)}
                            className={`px-2 py-1 text-xs font-semibold ${st === 'Closed' ? 'text-red-600 hover:text-red-800' : 'text-primary hover:underline'}`}
                          >
                            {st === 'Closed' ? 'Close Ticket' : st === 'Open' ? 'Reopen' : `Mark ${st}`}
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Assignment dropdown for Staff */}
                  {isStaff && (
                    <select
                      value={selectedTicket.assignedTo?._id || ''}
                      onChange={(e) => handleAssignTicket(selectedTicket._id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map((su) => (
                        <option key={su._id} value={su._id}>
                          {su.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
                {/* Description Box */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-start justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Raised By: {selectedTicket.raisedBy?.name}</span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Conversation Thread */}
                {selectedTicket.messages?.map((msg, index) => {
                  const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);

                  // Check if it's a status notification message (status updates/assign notifications don't look like chat bubbles)
                  const isNotification = msg.message.startsWith('Status updated to:') || msg.message.startsWith('Ticket assigned to:') || msg.message.startsWith('Ticket created');

                  if (isNotification) {
                    return (
                      <div key={index} className="flex justify-center my-2">
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-2xs text-slate-600 font-medium border border-slate-300">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={`flex flex-col max-w-[85%] ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-2xs text-slate-400 px-1">
                        <span className="font-semibold text-slate-600">{msg.sender?.name}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`mt-1 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-2xs ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Footer Reply Box */}
              {selectedTicket.status === 'Closed' && selectedTicket.canReply ? (
                <div className="bg-slate-100 border-t border-slate-200 py-4 px-6 text-center text-xs font-medium text-slate-500">
                  This ticket has been closed. Sending a reply reopens it.
                </div>
              ) : null}

              {selectedTicket.canReply ? (
              <form onSubmit={handleSendReply} className="border-t border-slate-200 bg-white p-4 flex gap-3 items-center">
                <input
                  type="text"
                  maxLength={5000}
                  placeholder={selectedTicket.status === 'Closed' ? "Type a message to reopen and reply..." : "Type your message here..."}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={replyLoading || !replyMessage.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
                >
                  <Send size={16} />
                </Button>
              </form>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center h-[75vh]">
              <MessageSquare size={48} className="text-slate-200 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">No Ticket Selected</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                Select a ticket from the left panel to review message details, adjust ticket status, or reply.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
          <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Raise Support Ticket</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              {createError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{createError}</div> : null}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot log in to account, billing discrepancy..."
                  maxLength={200}
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Sales">Sales</option>
                    <option value="General">General</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your concern or issue in detail..."
                  maxLength={5000}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" onClick={() => setIsCreateOpen(false)} className="bg-slate-100 text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-primary text-white">
                  {creating ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
