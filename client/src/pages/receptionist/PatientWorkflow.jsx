import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, FileText, Beaker, User } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function PatientWorkflow() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      fetchAppointmentDetails(selectedAppointment._id);
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      // Get today's appointments and recent ones
      const today = new Date().toDateString();
      const filtered = res.data.appointments?.filter(apt => 
        new Date(apt.appointmentDate).toDateString() >= today
      ) || [];
      setAppointments(filtered);
    } catch (err) {
      toast.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointmentDetails(res.data);
      
      // Fetch reports for this appointment
      const reportsRes = await api.get(`/reports/appointment/${appointmentId}`);
      setReportDetails(reportsRes.data || []);
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sample_collected: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      delivered: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      entered: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed' || status === 'verified' || status === 'delivered') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === 'pending' || status === 'processing') {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    } else if (status === 'cancelled') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Clock className="w-5 h-5 text-blue-600" />;
  };

  if (loading) return <LoadingSpinner text="Loading patient workflow..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Workflow Tracking</h1>
        <p className="text-slate-500 text-sm">Monitor patient journey from admission to report delivery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-1">
          <div className="card space-y-3">
            <h2 className="font-semibold text-slate-800">Today's Patients</h2>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {appointments.map(apt => (
                  <button
                    key={apt._id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedAppointment?._id === apt._id
                        ? 'bg-primary-100 border-2 border-primary-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{apt.patient?.name}</p>
                        <p className="text-xs text-slate-500">{apt.patient?.patientId}</p>
                        <p className="text-xs text-slate-600 mt-1">{apt.tests?.length || 0} test(s)</p>
                      </div>
                      {getStatusIcon(apt.status)}
                    </div>
                    <div className={`text-xs mt-2 px-2 py-1 rounded w-fit ${getStatusColor(apt.status)}`}>
                      {apt.status?.replace(/_/g, ' ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workflow Details */}
        <div className="lg:col-span-2">
          {selectedAppointment && appointmentDetails ? (
            <div className="space-y-4">
              {/* Patient Info Card */}
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium text-slate-800">{appointmentDetails.patient?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Patient ID</p>
                    <p className="font-medium text-slate-800">{appointmentDetails.patient?.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">IP Number</p>
                    <p className="font-medium text-slate-800">{appointmentDetails.patient?.ipNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Age / Gender</p>
                    <p className="font-medium text-slate-800">
                      {appointmentDetails.patient?.age}{appointmentDetails.patient?.ageUnit === 'years' ? 'y' : appointmentDetails.patient?.ageUnit === 'months' ? 'm' : 'd'} / {appointmentDetails.patient?.gender?.charAt(0).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Contact</p>
                    <p className="font-medium text-slate-800">{appointmentDetails.patient?.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium text-slate-800">{appointmentDetails.patient?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Workflow Timeline */}
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-4">Workflow Status</h3>
                <div className="space-y-4">
                  {/* Step 1: Registration */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="h-12 w-0.5 bg-slate-300 mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-slate-800">Patient Registered</p>
                      <p className="text-sm text-slate-500">{formatDate(appointmentDetails.createdAt, 'dd MMM yyyy HH:mm')}</p>
                      <p className="text-sm text-slate-600 mt-1">ID: {appointmentDetails.appointmentId}</p>
                    </div>
                  </div>

                  {/* Step 2: Appointment Scheduled */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        appointmentDetails.status !== 'pending' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {appointmentDetails.status !== 'pending' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="h-12 w-0.5 bg-slate-300 mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-slate-800">Appointment Scheduled</p>
                      <p className="text-sm text-slate-500">{formatDate(appointmentDetails.appointmentDate, 'dd MMM yyyy HH:mm')}</p>
                      <p className="text-sm text-slate-600 mt-1">{appointmentDetails.tests?.length || 0} Test(s)</p>
                    </div>
                  </div>

                  {/* Step 3: Sample Collection */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        appointmentDetails.status === 'sample_collected' || appointmentDetails.status === 'processing' || appointmentDetails.status === 'completed'
                          ? 'bg-green-100'
                          : 'bg-slate-100'
                      }`}>
                        {appointmentDetails.sampleCollectedAt ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <Beaker className={`w-6 h-6 ${appointmentDetails.status === 'sample_collected' ? 'text-yellow-600' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div className="h-12 w-0.5 bg-slate-300 mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-slate-800">Sample Collected</p>
                      {appointmentDetails.sampleCollectedAt ? (
                        <p className="text-sm text-slate-500">{formatDate(appointmentDetails.sampleCollectedAt, 'dd MMM yyyy HH:mm')}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Pending collection</p>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Report Generation */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        reportDetails?.some(r => r.status === 'verified' || r.status === 'delivered') ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        {reportDetails?.length > 0 ? (
                          <FileText className={`w-6 h-6 ${
                            reportDetails.some(r => r.status === 'verified' || r.status === 'delivered')
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`} />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Report Generation & Verification</p>
                      {reportDetails?.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {reportDetails.map((report, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-slate-800">{report.tests?.map((test) => test?.name).filter(Boolean).join(', ') || report.test?.name}</p>
                                  <p className="text-xs text-slate-500">Report ID: {report.reportId}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                              </div>
                              {report.verifiedAt && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Verified: {formatDate(report.verifiedAt, 'dd MMM yyyy')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 mt-1">No reports generated yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className={`font-semibold capitalize ${
                      appointmentDetails.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {appointmentDetails.status?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-slate-500">Tests</p>
                    <p className="font-semibold text-purple-600">{appointmentDetails.tests?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-slate-500">Reports</p>
                    <p className="font-semibold text-green-600">{reportDetails?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-slate-500">Verified</p>
                    <p className="font-semibold text-amber-600">
                      {reportDetails?.filter(r => r.status === 'verified' || r.status === 'delivered').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">Select a patient to view workflow details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
