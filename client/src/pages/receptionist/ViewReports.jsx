import { useState, useEffect } from 'react';
import { FileText, Download, Phone, Filter, Search, Eye, Printer } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import ReportPrint from '../../components/reports/ReportPrint';
import toast from 'react-hot-toast';
import { shareReportViaWhatsAppNumber } from '../../utils/whatsapp';
import { exportReportToPDF, printReport, exportReportAsText } from '../../utils/pdf';

export default function ViewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/reports${query}`);
      setReports(res.data.reports || []);
    } catch (err) {
      toast.error('Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.patient?.name?.toLowerCase().includes(searchLower) ||
      report.patient?.patientId?.toLowerCase().includes(searchLower) ||
      report.patient?.ipNumber?.toLowerCase().includes(searchLower) ||
      report.test?.name?.toLowerCase().includes(searchLower) ||
      report.reportId?.toLowerCase().includes(searchLower)
    );
  });

  const shareOnWhatsApp = (report) => {
    // Get patient phone number if available
    const phoneNumber = report.patient?.phone;
    if (phoneNumber) {
      shareReportViaWhatsAppNumber(report, phoneNumber);
      toast.success('WhatsApp opened! Message ready to send');
    } else {
      // Fallback to generic share
      const message = `
📋 *Report Generated* 📋

👤 Patient: ${report.patient?.name}
🆔 ID: ${report.patient?.patientId}
🧪 Test: ${report.test?.name}
📑 Report ID: ${report.reportId}
📊 Status: ${report.status}

Please check your portal for details.
      `.trim();
      const encoded = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/?text=${encoded}`;
      window.open(whatsappLink, '_blank');
      toast.success('WhatsApp opened! Share with patient');
    }
  };

  const downloadPDF = (report) => {
    try {
      const success = exportReportToPDF(report);
      if (success) {
        toast.success('Report ready for download/printing');
      } else {
        toast.error('Could not generate PDF');
      }
    } catch (err) {
      toast.error('Error downloading PDF');
    }
  };

  const handlePrint = (report) => {
    try {
      printReport(report);
    } catch (err) {
      toast.error('Error printing report');
    }
  };

  if (loading) return <LoadingSpinner text="Loading reports..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Reports</h1>
        <p className="text-slate-500 text-sm">View and manage lab reports</p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="entered">Entered</option>
            <option value="verified">Verified</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No reports found</p>
            <p className="text-slate-300 text-sm">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div key={report._id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{report.patient?.name}</p>
                        <p className="text-sm text-slate-500">{report.patient?.patientId}</p>
                      </div>
                      <Badge status={report.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Test:</span>
                        <p className="font-medium">{report.test?.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Report ID:</span>
                        <p className="font-medium">{report.reportId}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Date:</span>
                        <p>{formatDate(report.reportDate, 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Age/Gender:</span>
                        <p>
                          {report.patient?.age}
                          {report.patient?.ageUnit === 'years' ? 'y' : report.patient?.ageUnit === 'months' ? 'm' : 'd'} / {report.patient?.gender?.charAt(0).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Actions */}
                  <div className="flex flex-col justify-between gap-2">
                    <div className="text-sm text-slate-600">
                      {report.enteredBy && <p>Entered by: {report.enteredBy.name}</p>}
                      {report.verifiedBy && <p>Verified by: {report.verifiedBy.name}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowPrintView(true);
                        }}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handlePrint(report)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                      <button
                        onClick={() => downloadPDF(report)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => shareOnWhatsApp(report)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 text-sm rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hidden Print View */}
                <div id={`report-print-${report._id}`} style={{ display: 'none' }}>
                  <ReportPrint report={report} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      {showPrintView && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl m-4 w-full max-w-4xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Report Preview</h2>
              <button
                onClick={() => setShowPrintView(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto bg-slate-50">
              <div className="bg-white p-6">
                <ReportPrint report={selectedReport} />
              </div>
            </div>
            <div className="flex gap-2 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowPrintView(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(selectedReport)}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => downloadPDF(selectedReport)}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => shareOnWhatsApp(selectedReport)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Share WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
