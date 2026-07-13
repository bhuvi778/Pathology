import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate, getReportTestLabel } from '../../utils/helpers';
import { Printer } from 'lucide-react';
import ReportPrint from '../../components/reports/ReportPrint';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [printData, setPrintData] = useState(null);
  const printRef = useRef();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const load = () => {
    const doctorId = user?.doctorProfile?._id || user?.doctorProfile;
    if (!doctorId) { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('doctor', doctorId);
    params.set('page', page);
    params.set('limit', 20);
    api.get(`/reports?${params.toString()}`).then(r => {
      setReports(r.data.reports);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, page, user]);

  const doPrint = async (report) => {
    try {
      const fullReport = await api.get(`/reports/${report._id}`);
      setPrintData(fullReport.data);
      setTimeout(handlePrint, 100);
    } catch {
      console.error('Could not load report for printing');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 text-sm">{total} total reports</p>
      </div>

      <div className="flex gap-2">
        {[['', 'All'], ['pending', 'Pending'], ['entered', 'Entered'], ['verified', 'Verified'], ['delivered', 'Delivered']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === v ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Report ID</th>
                <th className="table-th">Patient</th>
                <th className="table-th">Tests</th>
                <th className="table-th">Doctor</th>
                <th className="table-th">Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400">No reports found</td></tr>
              )}
              {reports.map(r => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="table-td"><span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{r.reportId}</span></td>
                  <td className="table-td">
                    <p className="font-medium text-slate-800">{r.patient?.name}</p>
                    <p className="text-xs text-slate-400">{r.patient?.patientId}</p>
                  </td>
                  <td className="table-td text-slate-600 text-sm">{getReportTestLabel(r)}</td>
                  <td className="table-td text-slate-500 text-sm">{r.doctor?.name || '—'}</td>
                  <td className="table-td text-slate-500 text-sm">{formatDate(r.reportDate)}</td>
                  <td className="table-td"><Badge status={r.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {(r.status === 'entered' || r.status === 'verified' || r.status === 'delivered') && (
                        <button onClick={() => doPrint(r)} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/doctor/results/${r.appointment?._id || r.appointment}`)}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="hidden">
        <div ref={printRef}>
          {printData && <ReportPrint report={printData} appointment={printData.appointment} />}
        </div>
      </div>

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
