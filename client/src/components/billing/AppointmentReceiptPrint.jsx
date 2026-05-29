import { formatDate, formatCurrency } from '../../utils/helpers';

export default function AppointmentReceiptPrint({ appointment }) {
  const labSettings = JSON.parse(localStorage.getItem('labSettings') || '{}');
  const labName = labSettings.labName || 'Shri Dhanvantari Pathology & Diagnostic Centre';
  const labAddress = labSettings.labAddress || '42, Nehru Nagar, Near District Hospital, Lucknow, Uttar Pradesh - 226001';
  const labPhone = labSettings.labPhone || '+91-522-2601234';
  const patient = appointment?.patient;
  const tests = appointment?.tests || [];
  const total = tests.reduce((acc, t) => acc + (t.price || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {/* Lab Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#1e3a8a' }}>{labName}</h1>
        <p style={{ fontSize: '10px', margin: '1px 0', color: '#4b5563' }}>{labAddress}</p>
        <p style={{ fontSize: '10px', margin: '1px 0', color: '#4b5563' }}>Tel: {labPhone}</p>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '8px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb' }}>Appointment Receipt</h2>
      </div>

      {/* Appointment Info */}
      <div style={{ marginBottom: '12px', padding: '8px 10px', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '13px' }}>{appointment?.appointmentId}</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>{formatDate(appointment?.appointmentDate || new Date(), 'dd/MM/yyyy')}</span>
        </div>
        {appointment?.priority === 'urgent' && (
          <div style={{ marginTop: '4px', padding: '2px 6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '3px', fontSize: '11px', color: '#dc2626', fontWeight: 'bold', display: 'inline-block' }}>
            ⚡ URGENT
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div style={{ marginBottom: '12px' }}>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151', width: '100px' }}>Patient:</td><td style={{ paddingBottom: '3px' }}>{patient?.name}</td></tr>
            <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151' }}>Patient ID:</td><td style={{ paddingBottom: '3px', fontFamily: 'monospace' }}>{patient?.patientId}</td></tr>
            <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151' }}>Age/Gender:</td><td style={{ paddingBottom: '3px' }}>{patient?.age} {patient?.ageUnit} / {patient?.gender}</td></tr>
            <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151' }}>Phone:</td><td style={{ paddingBottom: '3px' }}>{patient?.phone}</td></tr>
            {appointment?.doctor && <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151' }}>Doctor:</td><td style={{ paddingBottom: '3px' }}>{appointment.doctor?.name}</td></tr>}
            {appointment?.referredBy && <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#374151' }}>Ref. By:</td><td style={{ paddingBottom: '3px' }}>{appointment.referredBy}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Tests */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', color: '#374151' }}>Tests Ordered:</p>
        {tests.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '11px' }}>
            <span>{t.name}</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(t.price)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: '4px', borderTop: '2px solid #374151', fontWeight: 'bold', fontSize: '13px' }}>
          <span>Total Amount</span>
          <span style={{ color: '#2563eb' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      {appointment?.notes && (
        <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px', fontStyle: 'italic' }}>Note: {appointment.notes}</p>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px dashed #d1d5db', paddingTop: '8px', marginTop: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '3px' }}>Thank You!</p>
        <p style={{ fontSize: '10px', color: '#6b7280' }}>Please carry this receipt when collecting reports.</p>
        <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>Printed: {formatDate(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    </div>
  );
}
