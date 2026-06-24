import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Card from '../components/Card.jsx';

export default function Dashboard({ title = 'Dashboard' }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setReport(res.data));
  }, []);

  const cards = [
    ['Users', report?.users || 0],
    ['Products', report?.products || 0],
    ['Services', report?.services || 0],
    ['Leads', report?.leads || 0],
    ['Orders', report?.orders || 0],
    ['Paid Payments', report?.paidPayments || 0],
    ['Enquiries', report?.enquiries || 0],
    ['Revenue', `Rs ${report?.revenue || 0}`]
  ];

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">{title}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-secondary">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
