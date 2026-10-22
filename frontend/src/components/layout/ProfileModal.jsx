import { useState } from 'react';
import { Camera, X, PencilLine, Mail, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import Avatar from './Avatar.jsx';

const toForm = (user) => ({
  name: user?.name || '',
  phone: user?.phone || '',
  city: user?.city || '',
  location: user?.location || '',
  profilePhoto: user?.profilePhoto || '',
  correspondenceAddress: user?.correspondenceAddress || '',
  permanentAddress: user?.permanentAddress || '',
  gender: user?.gender || '',
  age: user?.age || '',
  password: '',
});

const notProvided = (value) => value || 'Not provided';
const humanize = (value) => (value || '').replaceAll('_', ' ');

// Read-only details, grouped as they appear in the view mode.
const DETAIL_GROUPS = (user) => [
  {
    title: 'Location',
    items: [
      { label: 'City', value: notProvided(user?.city) },
      { label: 'Location', value: notProvided(user?.location) },
      { label: 'Correspondence address', value: notProvided(user?.correspondenceAddress), wide: true },
      { label: 'Permanent address', value: notProvided(user?.permanentAddress), wide: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Joining date', value: user?.joiningDate ? new Intl.DateTimeFormat('en-GB').format(new Date(user.joiningDate)) : '—' },
      { label: 'Employment', value: humanize(user?.employmentClassification || 'regular_employee') },
      { label: 'Gender', value: notProvided(user?.gender) },
      { label: 'Age', value: user?.age ? `${user.age}` : 'Not provided' },
    ],
  },
];

// Editable text inputs in the edit mode.
const TEXT_FIELDS = [
  { key: 'name', label: 'Full name', required: true },
  { key: 'phone', label: 'Phone number' },
  { key: 'city', label: 'City' },
  { key: 'location', label: 'Location' },
];

function Field({ label, children, action }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="ax-text-2 text-xs font-medium">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const cancelEdit = () => {
    setForm(toForm(user));
    setIsEditing(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setUploading(true);
      const res = await api.post('/auth/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, profilePhoto: res.data.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password, age, ...rest } = form;
    const payload = { ...rest, age: age ? Number(age) : null };
    if (password.trim()) payload.password = password;

    try {
      setSaving(true);
      const res = await api.put('/auth/profile', payload);
      setUser(res.data);
      setForm(toForm(res.data));
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
      <div className="ax-overlay absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="ax-menu relative z-10 my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="ax-divider flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 id="profile-title" className="ax-title">Profile settings</h2>
            <p className="ax-sub mt-0.5">View and update your personal and contact details.</p>
          </div>
          <button type="button" onClick={onClose} className="ax-iconbtn ax-iconbtn--sm" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Identity column */}
            <div className="ax-divider flex flex-col items-center border p-4 text-center" style={{ background: 'var(--ax-surface-2)' }}>
              <div className="relative mb-3">
                <Avatar src={form.profilePhoto} name={user?.name} size={88} />
                {isEditing && (
                  <label
                    htmlFor="avatar-file"
                    className="ax-iconbtn ax-iconbtn--sm absolute -bottom-2 -right-2 cursor-pointer"
                    style={{ background: 'var(--ax-surface)' }}
                    title="Upload photo"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    <input type="file" id="avatar-file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={uploading} />
                  </label>
                )}
              </div>
              <p className="ax-title">{user?.name}</p>
              <p className="ax-label mt-1">{humanize(user?.role || 'super_admin')}</p>

              <div className="ax-divider ax-text-2 mt-4 w-full space-y-2 border-t pt-3 text-left text-xs">
                <p className="flex items-center gap-2"><Mail size={13} className="ax-muted shrink-0" aria-hidden="true" /> <span className="truncate">{user?.email}</span></p>
                {user?.phone && <p className="flex items-center gap-2"><Phone size={13} className="ax-muted shrink-0" aria-hidden="true" /> {user.phone}</p>}
              </div>

              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)} className="ax-btn ax-btn--primary mt-4 w-full">
                  <PencilLine size={14} aria-hidden="true" /> Edit profile
                </button>
              )}
            </div>

            {/* Details column */}
            <div className="space-y-5 md:col-span-2">
              {!isEditing ? (
                DETAIL_GROUPS(user).map((group) => (
                  <section key={group.title}>
                    <p className="ax-label ax-divider mb-3 w-full border-b pb-1.5">{group.title}</p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                      {group.items.map((item) => (
                        <div key={item.label} className={item.wide ? 'col-span-2' : ''}>
                          <dt className="ax-muted text-xs">{item.label}</dt>
                          <dd className="whitespace-pre-line" style={{ color: 'var(--ax-text)' }}>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {TEXT_FIELDS.map((f) => (
                      <Field key={f.key} label={f.label}>
                        <input type="text" required={f.required} value={form[f.key]} onChange={set(f.key)} className="ax-input" />
                      </Field>
                    ))}
                    <Field label="Gender">
                      <select value={form.gender} onChange={set('gender')} className="ax-input">
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Age">
                      <input type="number" min="0" value={form.age} onChange={set('age')} className="ax-input" />
                    </Field>
                  </div>

                  <Field label="Correspondence address">
                    <textarea rows={2} value={form.correspondenceAddress} onChange={set('correspondenceAddress')} className="ax-input resize-none" />
                  </Field>

                  <Field
                    label="Permanent address"
                    action={
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, permanentAddress: prev.correspondenceAddress }))}
                        className="text-[11px] font-medium hover:underline"
                        style={{ color: 'var(--ax-accent)' }}
                      >
                        Same as correspondence
                      </button>
                    }
                  >
                    <textarea rows={2} value={form.permanentAddress} onChange={set('permanentAddress')} className="ax-input resize-none" />
                  </Field>

                  <Field label="New password (leave blank to keep current)">
                    <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="••••••••" className="ax-input" />
                  </Field>

                  <div className="ax-divider flex justify-end gap-2 border-t pt-4">
                    <button type="button" onClick={cancelEdit} className="ax-btn ax-btn--ghost">Cancel</button>
                    <button type="submit" disabled={saving || uploading} className="ax-btn ax-btn--primary">
                      {saving && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
                      Save changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
