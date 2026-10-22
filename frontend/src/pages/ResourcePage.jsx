import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';

export default function ResourcePage({ title, endpoint }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get(endpoint);
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={load} className="inline-flex items-center gap-2 px-3 py-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button className="inline-flex items-center gap-2 px-3 py-2">
            <Plus size={16} />
            Add New
          </Button>
        </div>
      </div>
      <Card>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3">Name / Title</th>
                <th className="px-3 py-3">Type / Status</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4"><Loader /></td></tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-3 py-3 font-medium">{item.name || item.title || item.code || item.invoiceNo || item.email || item._id}</td>
                    <td className="px-3 py-3 text-slate-600">{item.type || item.status || item.role || '-'}</td>
                    <td className="px-3 py-3 text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-3 text-primary">Edit</td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-3 py-4 text-slate-500" colSpan="4">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
