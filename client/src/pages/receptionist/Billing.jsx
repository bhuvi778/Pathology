import { useState, useEffect } from 'react';
import { Search, CreditCard, Printer } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../utils/helpers';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paidAmount: 0, paymentMethod: 'cash', discount: 0, discountType: 'fixed' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/bills?status=${statusFilter}&page=${page}&limit=20`).then(r => {
      setBills(r.data.bills);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const openPayment = (bill) => {
    setSelectedBill(bill);
    setPaymentForm({ paidAmount: bill.balance, paymentMethod: bill.paymentMethod || 'cash', discount: bill.discount || 0, discountType: bill.discountType || 'fixed' });
    setPaymentModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/bills/${selectedBill._id}/payment`, {
        paidAmount: Number(paymentForm.paidAmount) + (selectedBill.paidAmount || 0),
        paymentMethod: paymentForm.paymentMethod,
        discount: Number(paymentForm.discount),
        discountType: paymentForm.discountType,
      });
      toast.success('Payment recorded!');
      setPaymentModal(false);
      load();
    } catch (err) {
      toast.error('Error processing payment');
    } finally {
      setSaving(false);
    }
  };

  const totalRevenue = bills.filter(b => b.paymentStatus === 'paid').reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing & Payments</h1>
          <p className="text-slate-500 text-sm">{total} total bills</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <p className="text-xs text-green-600">Collected (this view)</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
        <option value="">All Bills</option>
        <option value="pending">Pending</option>
        <option value="partial">Partially Paid</option>
        <option value="paid">Paid</option>
      </select>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr>
                <th className="table-th">Bill ID</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Total</th>
                <th className="table-th">Paid</th>
                <th className="table-th">Balance</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">No bills found</td></tr>
              )}
              {bills.map(b => (
                <tr key={b._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{b.billId}</span></td>
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{b.patient?.name}</p>
                    <p className="text-xs text-slate-400">{b.patient?.patientId}</p>
                  </td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1">
                      {b.items?.slice(0, 2).map((item, i) => <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.testName?.split(' ')[0]}</span>)}
                      {b.items?.length > 2 && <span className="text-xs text-slate-400">+{b.items.length - 2}</span>}
                    </div>
                  </td>
                  <td className="table-td font-semibold text-slate-800">{formatCurrency(b.total)}</td>
                  <td className="table-td text-green-600 font-medium">{formatCurrency(b.paidAmount)}</td>
                  <td className="table-td font-medium" style={{ color: b.balance > 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(b.balance)}</td>
                  <td className="table-td"><Badge status={b.paymentStatus} /></td>
                  <td className="table-td">
                    {b.paymentStatus !== 'paid' && (
                      <button onClick={() => openPayment(b)} className="btn-success py-1 px-3 text-xs flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        {selectedBill && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="font-semibold text-slate-800">{selectedBill.patient?.name}</p>
              <p className="text-sm text-slate-500">{selectedBill.billId}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span>Subtotal:</span><span className="font-medium">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Already Paid:</span><span>{formatCurrency(selectedBill.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 mt-1">
                <span>Balance:</span><span>{formatCurrency(selectedBill.balance)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount</label>
                <div className="flex gap-2">
                  <input type="number" min="0" value={paymentForm.discount} onChange={e => setPaymentForm(f => ({ ...f, discount: e.target.value }))} className="input-field" />
                  <select value={paymentForm.discountType} onChange={e => setPaymentForm(f => ({ ...f, discountType: e.target.value }))} className="input-field w-20">
                    <option value="fixed">₹</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Amount Receiving (₹)</label>
              <input type="number" min="0" max={selectedBill.balance} value={paymentForm.paidAmount} onChange={e => setPaymentForm(f => ({ ...f, paidAmount: e.target.value }))} className="input-field text-lg font-semibold" required />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPaymentModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-success">{saving ? 'Processing...' : 'Confirm Payment'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
