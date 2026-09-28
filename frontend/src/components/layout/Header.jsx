import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, User as UserIcon, ChevronDown, Camera, X, PencilLine, Mail, Phone, UserCheck, Cake, Loader2 } from 'lucide-react';
import Button from '../Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { api } from '../../api/client.js';

export default function Header({ onMenuClick }) {
  const { user, logout, setUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
        setShowResults(true);
      } catch (err) {
        console.error('Error performing search', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    location: '',
    profilePhoto: '',
    correspondenceAddress: '',
    permanentAddress: '',
    gender: '',
    age: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        location: user.location || '',
        profilePhoto: user.profilePhoto || '',
        correspondenceAddress: user.correspondenceAddress || '',
        permanentAddress: user.permanentAddress || '',
        gender: user.gender || '',
        age: user.age || '',
        password: ''
      });
    }
  }, [user, profileModalOpen]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingAvatar(true);
      const res = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setForm((prev) => ({ ...prev, profilePhoto: res.data.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        phone: form.phone,
        city: form.city,
        location: form.location,
        profilePhoto: form.profilePhoto,
        correspondenceAddress: form.correspondenceAddress,
        permanentAddress: form.permanentAddress,
        gender: form.gender,
        age: form.age ? Number(form.age) : null,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const res = await api.put('/auth/profile', payload);
      setUser(res.data);
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const renderSearchResults = () => {
    if (!showResults || !searchQuery) return null;

    const hasResults =
      (searchResults?.users?.length > 0) ||
      (searchResults?.leads?.length > 0) ||
      (searchResults?.orders?.length > 0) ||
      (searchResults?.products?.length > 0);

    return (
      <>
        {/* Backdrop to close on click outside */}
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowResults(false)} />
        <div className="absolute top-full left-0 right-0 mt-2 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {searching ? (
            <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs font-semibold">Searching database...</span>
            </div>
          ) : !searchResults ? (
            <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs font-semibold">Searching database...</span>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-left">
              {/* Leads Section */}
              {searchResults.leads?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Leads</h4>
                  <div className="space-y-1.5">
                    {searchResults.leads.map(l => (
                      <div key={l._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer" onClick={() => { setShowResults(false); navigate(`/leads?search=${encodeURIComponent(l.contactName || l.companyName)}`); }}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{l.companyName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{l.contactName ? `${l.contactName} • ${l.phone}` : l.phone}</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full">{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products/Projects Section */}
              {searchResults.products?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Products & Projects</h4>
                  <div className="space-y-1.5">
                    {searchResults.products.map(p => (
                      <div key={p._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer" onClick={() => { setShowResults(false); navigate(`/catalog?search=${encodeURIComponent(p.title)}`); }}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{p.sku ? `SKU: ${p.sku}` : p.type ? `Type: ${p.type}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {p.price > 0 && <p className="text-xs font-bold text-slate-800">₹{p.price.toLocaleString()}</p>}
                          {p.projectStatus && <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">{p.projectStatus}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Section */}
              {searchResults.orders?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Orders</h4>
                  <div className="space-y-1.5">
                    {searchResults.orders.map(o => (
                      <div key={o._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer" onClick={() => { setShowResults(false); navigate(`/orders`); }}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">Order: {o.customerInfo?.name || 'Walk-in Client'}</p>
                          <p className="text-[10px] text-slate-500 truncate">{new Date(o.createdAt).toLocaleDateString()} • {o.customerInfo?.phone || ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-800">₹{o.total.toLocaleString()}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full uppercase">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Section */}
              {searchResults.users?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Users</h4>
                  <div className="space-y-1.5">
                    {searchResults.users.map(u => (
                      <div key={u._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer" onClick={() => { setShowResults(false); navigate(`/users`); }}>
                        <div className="flex items-center gap-2 min-w-0">
                          {u.profilePhoto ? (
                            <img src={u.profilePhoto} alt={u.name} className="h-6 w-6 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full uppercase shrink-0">{u.role.replaceAll('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      {/* FIX: grid -> flex, so a hidden/extra child can never push the profile to a new row */}
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* 1. Menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-theme border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* 2. Title */}
        <div className="min-w-0 shrink-0">
          {/* <p className="text-sm text-slate-500">{settings?.brand?.name || 'Common CRM'}</p> */}
          <h1 className="truncate text-base font-semibold">Admin Panel</h1>
        </div>

        {/* 3. Desktop search: flex-1 takes the middle space */}
        <div className="relative mx-auto hidden w-full max-w-xl flex-1 md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="h-10 w-full rounded-theme border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              placeholder="Search users, orders, products..."
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
          </label>
          {renderSearchResults()}
        </div>

        {/* Spacer on mobile so bell + profile stay on the right */}
        <div className="flex-1 md:hidden" />

        {/* 4. Bell + Profile */}
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" />
          </button>

          {/* Clickable Profile Section with Dropdown */}
          <div className="relative shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer select-none rounded-theme hover:bg-slate-50 p-1.5 transition"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
                </div>
              )}
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-xs font-semibold text-slate-900 flex items-center gap-0.5">
                  {user?.name || 'Super Admin'}
                  <ChevronDown size={12} className="text-slate-500" />
                </p>
                <p className="text-[10px] capitalize text-slate-500">
                  {(user?.role || 'super_admin').replaceAll('_', ' ')}
                </p>
              </div>
            </div>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-20 cursor-default" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-theme border border-slate-200 bg-white py-1 shadow-lg z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon size={16} />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="px-4 pb-3 md:hidden relative">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-10 w-full rounded-theme border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            placeholder="Search users, orders, products..."
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
        </label>
        {renderSearchResults()}
      </div>

      {/* Profile Settings Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="absolute inset-0 cursor-default" onClick={() => { setProfileModalOpen(false); setIsEditing(false); }} />

          <div className="relative z-10 w-full max-w-2xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Profile Settings</h2>
                <p className="mt-0.5 text-xs text-slate-500">View and update your personal info and contact details.</p>
              </div>
              <button
                type="button"
                onClick={() => { setProfileModalOpen(false); setIsEditing(false); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Avatar & Quick Info */}
                  <div className="md:col-span-1 flex flex-col items-center text-center p-4 border border-slate-100 rounded-theme bg-slate-50/50">
                    <div className="relative mb-3">
                      {form.profilePhoto ? (
                        <img src={form.profilePhoto} alt="Profile" className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-md" />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md">
                          {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-950">{user?.name}</h3>
                    <p className="text-xs text-slate-500 capitalize mb-3">{(user?.role || 'super_admin').replaceAll('_', ' ')}</p>

                    <div className="w-full border-t border-slate-200/60 my-2 pt-2 text-left space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> <span className="truncate">{user?.email}</span></div>
                      {user?.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> <span>{user.phone}</span></div>}
                      {user?.gender && <div className="flex items-center gap-2"><UserCheck size={12} className="text-slate-400" /> <span className="capitalize">{user.gender}</span></div>}
                      {user?.age && <div className="flex items-center gap-2"><Cake size={12} className="text-slate-400" /> <span>{user.age} Years Old</span></div>}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="mt-4 flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary text-white text-xs font-semibold rounded-theme shadow-sm hover:bg-primary/95 transition"
                    >
                      <PencilLine size={14} />
                      Edit Profile
                    </button>
                  </div>

                  {/* Right Column: Detailed Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">Location details</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-500">City</span>
                          <span className="text-slate-800">{user?.city || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Location</span>
                          <span className="text-slate-800">{user?.location || 'Not provided'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-semibold text-slate-500">Correspondence Address</span>
                          <span className="text-slate-800 whitespace-pre-line">{user?.correspondenceAddress || 'Not provided'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-semibold text-slate-500">Permanent Address</span>
                          <span className="text-slate-800 whitespace-pre-line">{user?.permanentAddress || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">Account Info</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-500">Joining Date</span>
                          <span className="text-slate-800">{user?.joiningDate ? new Intl.DateTimeFormat('en-GB').format(new Date(user.joiningDate)) : '-'}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Employment classification</span>
                          <span className="text-slate-800 capitalize">{(user?.employmentClassification || 'regular_employee').replaceAll('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Upload Section */}
                    <div className="md:col-span-1 flex flex-col items-center p-4 border border-slate-100 rounded-theme bg-slate-50/50">
                      <div className="relative mb-3 group">
                        {form.profilePhoto ? (
                          <img src={form.profilePhoto} alt="Profile" className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-md" />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md">
                            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'A'}
                          </div>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 rounded-full bg-slate-900/50 flex items-center justify-center text-white">
                            <Loader2 className="animate-spin" size={16} />
                          </div>
                        )}
                        <label htmlFor="avatar-file" className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/95 transition shadow-md">
                          <Camera size={14} />
                          <input type="file" id="avatar-file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-4">Click camera to upload photo</p>

                      <div className="w-full space-y-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">Gender</label>
                          <select
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                            className="input py-1 text-xs"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">Age</label>
                          <input
                            type="number"
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                            placeholder="Enter age"
                            className="input py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Edit Form Fields */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">Full Name</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">Phone Number</label>
                          <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="input py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">City</label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="input py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-0.5">Location</label>
                          <input
                            type="text"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            className="input py-1.5 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="block text-xs font-semibold text-slate-600">Correspondence Address</label>
                        </div>
                        <textarea
                          rows={2}
                          value={form.correspondenceAddress}
                          onChange={(e) => setForm({ ...form, correspondenceAddress: e.target.value })}
                          className="input text-xs resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="block text-xs font-semibold text-slate-600">Permanent Address</label>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, permanentAddress: form.correspondenceAddress })}
                            className="text-[10px] text-primary font-semibold hover:underline"
                          >
                            Copy correspondence
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={form.permanentAddress}
                          onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                          className="input text-xs resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-0.5">Change Password (leave blank to keep current)</label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••"
                          className="input py-1.5 text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-theme hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-theme shadow-sm hover:bg-primary/95 transition disabled:opacity-60"
                        >
                          {saving && <Loader2 className="animate-spin" size={12} />}
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}