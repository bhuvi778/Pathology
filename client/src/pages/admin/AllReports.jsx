import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Printer, ExternalLink, PackageCheck, Phone } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import api from '../../utils/api';
import { formatDate, getReportTestLabel } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import ReportPrint from '../../components/reports/ReportPrint';
import toast from 'react-hot-toast';
import { shareReportViaWhatsAppNumber } from '../../utils/whatsapp';
import TestSelectionModal from '../../components/reports/TestSelectionModal';
import { buildScopedReportByTests, getReportTests } from '../../utils/helpers';
import { printReport } from '../../utils/pdf';

export default function AllReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [printData, setPrintData] = useState(null);
  const [selectionModal, setSelectionModal] = useState({ open: false, action: '', report: null });
  const printRef = useRef();
  const navigate = useNavigate();

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const load = (status, p, s) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (s) params.set('search', s);
    params.set('page', p);
    params.set('limit', 20);
    api.get(`/reports?${params.toString()}`).then(r => {
      setReports(r.data.reports);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter, page, search); }, [statusFilter, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    load(statusFilter, 1, e.target.value);
  };

  const doPrint = (reportData) => {
    setPrintData(reportData);
    setTimeout(handlePrint, 100);
  };

  const shareOnWhatsApp = async (reportData, options = {}) => {
    try {
      const result = await shareReportViaWhatsAppNumber(reportData, reportData.patient?.phone || '', options);
      if (result?.mode === 'native-share') {
        toast.success('WhatsApp share sheet opened with PDF attached');
      } else {
        toast.success('PDF downloaded and WhatsApp chat opened');
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast.error('Could not prepare WhatsApp share');
    }
  };

  const startReportAction = async (report, action) => {
    try {
      const fullReportResponse = await api.get(`/reports/${report._id}`);
      const fullReport = fullReportResponse.data;
      const tests = getReportTests(fullReport);

      if (tests.length <= 1) {
        if (action === 'print') doPrint(fullReport);
        else await shareOnWhatsApp(fullReport);
        return;
      }

      setSelectionModal({ open: true, action, report: fullReport });
    } catch {
      toast.error(action === 'print' ? 'Could not load report for printing' : 'Could not prepare WhatsApp share');
    }
  };

  const handleSelectionConfirm = async ({ selectedTestIds, pageMode }) => {
    const scopedReport = buildScopedReportByTests(selectionModal.report, selectedTestIds);
    const separatePages = pageMode === 'separate-pages';
    const selectedReports = separatePages
      ? selectedTestIds.map((testId) => buildScopedReportByTests(selectionModal.report, [testId]))
      : [];
    const selectedAction = selectionModal.action;
    setSelectionModal({ open: false, action: '', report: null });

    if (selectedAction === 'print') {
      if (separatePages && selectedReports.length > 1) {
        await printReport(selectedReports);
      } else {
        doPrint(scopedReport);
      }
      return;
    }

    await shareOnWhatsApp(scopedReport, {
      reports: separatePages && selectedReports.length > 1 ? selectedReports : undefined,
    });
  };

  const markDelivered = async (r) => {
    try {
      await api.put(`/reports/${r._id}`, { status: 'delivered' });
      toast.success('Report marked as delivered');
      load(statusFilter, page, search);
    } catch {
      toast.error('Error updating report status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Lab Reports</h1>
          <p className="text-slate-500 text-sm">{total} total reports</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={handleSearch} className="input-field pl-10" placeholder="Search by patient name or ID..." />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="entered">Entered</option>
          <option value="verified">Verified</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Admin can fill results, verify reports, and manage delivery from this section.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr>
                <th className="table-th">Report ID</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Doctor</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th">Entered By</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan="8" className="text-center py-12 text-slate-400">No reports found</td></tr>
              )}
              {reports.map(r => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{r.reportId}</span></td>
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{r.patient?.name}</p>
                    <p className="text-xs text-slate-400">{r.patient?.patientId}</p>
                  </td>
                  <td className="table-td">
                    <p className="font-medium text-slate-700">{getReportTestLabel(r)}</p>
                    <p className="text-xs text-slate-400">{r.tests?.length || (r.test ? 1 : 0)} test(s)</p>
                  </td>
                  <td className="table-td text-slate-500 text-sm">{r.doctor?.name || '—'}</td>
                  <td className="table-td"><Badge status={r.status} /></td>
                  <td className="table-td text-xs text-slate-400">{formatDate(r.reportDate)}</td>
                  <td className="table-td text-slate-500 text-sm">{r.enteredBy?.name || '—'}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Fill/Enter Report Results */}
                      {['pending', 'entered'].includes(r.status) && (
                        <button
                          onClick={() => navigate(`/admin/fill-report/${r.appointment?._id || r.appointment}`)}
                          title="Fill Report Reading"
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 border border-purple-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Open admin report entry workflow */}
                      <button
                        onClick={() => navigate(`/admin/fill-report/${r.appointment?._id || r.appointment}`)}
                        title="Open Admin Report Entry"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 border border-blue-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      {/* Print — only for entered/verified/delivered */}
                      {['entered', 'verified', 'delivered'].includes(r.status) && (
                        <button
                          onClick={() => startReportAction(r, 'print')}
                          title="Print Report"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Share WhatsApp — only for verified/delivered reports */}
                      {['verified', 'delivered'].includes(r.status) && (
                        <button
                          onClick={() => startReportAction(r, 'share')}
                          title="Share on WhatsApp"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 border border-green-100"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Mark Delivered — only for verified reports */}
                      {r.status === 'verified' && (
                        <button
                          onClick={() => markDelivered(r)}
                          title="Mark as Delivered"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 border border-green-100"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="hidden">
        <div ref={printRef}>
          {printData && <ReportPrint report={printData} appointment={printData.appointment} />}
        </div>
      </div>

      <TestSelectionModal
        open={selectionModal.open}
        report={selectionModal.report}
        actionLabel={selectionModal.action}
        onClose={() => setSelectionModal({ open: false, action: '', report: null })}
        onConfirm={handleSelectionConfirm}
      />

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing {reports.length} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center text-sm text-slate-600">Page {page}</span>
            <button disabled={reports.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

