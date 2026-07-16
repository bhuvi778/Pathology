import { useState, useEffect } from 'react';
import { Trash2, Edit2, Printer, Phone } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { printBill } from '../../utils/billPdf';
import { shareBillViaWhatsAppNumber } from '../../utils/whatsapp';

const emptyPayment = { paidAmount: '', discount: '', discountType: 'fixed', paymentMethod: 'cash' };

export default function AllBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState(emptyPayment);
  const [payBill, setPayBill] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = (status, p) => {
    setLoading(true);
    api.get(`/bills?status=${status}&page=${p}&limit=20`).then(r => {
      setBills(r.data.bills);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter, page); }, [statusFilter, page]);

  const totalRevenue = bills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);

  const openEditPayment = (b) => {
    setPayBill(b);
    setPayForm({
      paidAmount: b.paidAmount ?? '',
      discount: b.discount ?? '',
      discountType: b.discountType || 'fixed',
      paymentMethod: b.paymentMethod || 'cash',
    });
    setPayModal(true);
  };

  const handlePaySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/bills/${payBill._id}/payment`, {
        paidAmount: Number(payForm.paidAmount),
        discount: Number(payForm.discount) || 0,
        discountType: payForm.discountType,
        paymentMethod: payForm.paymentMethod,
      });
      toast.success('Bill updated successfully!');
      setPayModal(false);
      load(statusFilter, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating bill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Bill ${b.billId} (${b.patient?.name}) ko delete karna chahte hain?`)) return;
    try {
      await api.delete(`/bills/${b._id}`);
      toast.success('Bill deleted');
      load(statusFilter, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting bill');
    }
  };

  const loadBillForAction = async (bill) => {
    try {
      const response = await api.get(`/bills/${bill._id}`);
      return response.data;
    } catch {
      return bill;
    }
  };

  const handleBillPrint = async (bill) => {
    try {
      const fullBill = await loadBillForAction(bill);
      await printBill(fullBill);
    } catch {
      toast.error('Error printing bill');
    }
  };

  const handleBillShare = async (bill) => {
    try {
      const fullBill = await loadBillForAction(bill);
      const result = await shareBillViaWhatsAppNumber(fullBill, fullBill?.patient?.phone || '');
      if (result?.mode === 'native-share') {
        toast.success('WhatsApp share sheet opened with bill PDF');
      } else {
        toast.success('Bill PDF downloaded and WhatsApp chat opened');
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast.error('Could not prepare bill share');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Bills</h1>
          <p className="text-slate-500 text-sm">{total} total bills</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <p className="text-xs text-green-600 font-medium">Revenue (This Page)</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
        <option value="">All Bills</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially Paid</option>
        <option value="pending">Pending</option>
      </select>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr>
                <th className="table-th">Bill ID</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Total</th>
                <th className="table-th">Paid</th>
                <th className="table-th">Balance</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 && (
                <tr><td colSpan="9" className="text-center py-12 text-slate-400">No bills found</td></tr>
              )}
              {bills.map(b => (
                <tr key={b._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{b.billId}</span></td>
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{b.patient?.name}</p>
                    <p className="text-xs text-slate-400">{b.patient?.patientId}</p>
                  </td>
                  <td className="table-td text-sm text-slate-500">{b.items?.length} test(s)</td>
                  <td className="table-td font-semibold text-slate-800">{formatCurrency(b.total)}</td>
                  <td className="table-td text-green-600 font-medium">{formatCurrency(b.paidAmount)}</td>
                  <td className="table-td text-red-500 font-medium">{formatCurrency(b.balance)}</td>
                  <td className="table-td"><Badge status={b.paymentStatus} /></td>
                  <td className="table-td text-xs text-slate-400">{formatDate(b.createdAt)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBillPrint(b)}
                        title="Print Bill"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 border border-slate-200"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBillShare(b)}
                        title="Share Bill"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 border border-green-100"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditPayment(b)}
                        title="Edit Payment"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 border border-amber-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        title="Delete Bill"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 border border-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {bills.length} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center text-sm text-slate-600">Page {page}</span>
            <button disabled={bills.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={`Edit Payment — ${payBill?.billId}`}>
        {payBill && (
          <form onSubmit={handlePaySave} className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p className="text-slate-600">Patient: <span className="font-medium text-slate-800">{payBill.patient?.name}</span></p>
              <p className="text-slate-600">Subtotal: <span className="font-medium text-slate-800">{formatCurrency(payBill.subtotal)}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Discount Amount</label>
                <input type="number" min="0" value={payForm.discount} onChange={e => setPayForm(f => ({ ...f, discount: e.target.value }))} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="label">Discount Type</label>
                <select value={payForm.discountType} onChange={e => setPayForm(f => ({ ...f, discountType: e.target.value }))} className="input-field">
                  <option value="fixed">Fixed (₹)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Paid Amount (₹) *</label>
                <input required type="number" min="0" value={payForm.paidAmount} onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPayModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

