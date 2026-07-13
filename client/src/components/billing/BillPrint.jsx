import { formatDate, formatCurrency } from '../../utils/helpers';

export default function BillPrint({ bill }) {
  const labSettings = JSON.parse(localStorage.getItem('labSettings') || '{}');
  const labName = labSettings.labName || 'Laboratory';
  const labAddress = labSettings.labAddress || '';
  const labPhone = labSettings.labPhone || '';
  const patient = bill?.patient;

  const paymentStatusColor = bill?.paymentStatus === 'paid' ? '#16a34a' : bill?.paymentStatus === 'partial' ? '#d97706' : '#dc2626';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '3px solid #2563eb', paddingBottom: '12px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1e3a8a' }}>{labName}</h1>
        <p style={{ fontSize: '10px', margin: '1px 0', color: '#4b5563' }}>{labAddress}</p>
        <p style={{ fontSize: '10px', margin: '1px 0', color: '#4b5563' }}>Tel: {labPhone}</p>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '10px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px', color: '#2563eb' }}>Bill / Invoice</h2>
      </div>

      {/* Bill & Patient Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', padding: '10px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px' }}>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Bill ID: </span><span style={{ fontFamily: 'monospace' }}>{bill?.billId}</span></div>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Date: </span>{formatDate(bill?.createdAt || new Date(), 'dd/MM/yyyy')}</div>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Patient: </span>{patient?.name}</div>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Patient ID: </span>{patient?.patientId}</div>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Phone: </span>{patient?.phone}</div>
        <div><span style={{ fontWeight: 'bold', color: '#374151' }}>Age: </span>{patient?.age} {patient?.ageUnit} / {patient?.gender}</div>
        {bill?.appointment?.appointmentId && <div style={{ gridColumn: 'span 2' }}><span style={{ fontWeight: 'bold', color: '#374151' }}>Appt ID: </span>{bill.appointment.appointmentId}</div>}
      </div>

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{ backgroundColor: '#2563eb', color: '#fff' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px' }}>#</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px' }}>Test / Service</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '11px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill?.items?.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              <td style={{ padding: '7px 10px', color: '#6b7280' }}>{i + 1}</td>
              <td style={{ padding: '7px 10px' }}>{item.testName}</td>
              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
          <span style={{ color: '#4b5563' }}>Subtotal</span>
          <span>{formatCurrency(bill?.subtotal)}</span>
        </div>
        {bill?.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
            <span style={{ color: '#dc2626' }}>Discount ({bill.discountType === 'percent' ? `${bill.discount}%` : 'Fixed'})</span>
            <span style={{ color: '#dc2626' }}>- {formatCurrency(bill.discountType === 'percent' ? bill.subtotal * bill.discount / 100 : bill.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 3px 0', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #d1d5db', marginTop: '4px' }}>
          <span>Total</span>
          <span style={{ color: '#1e40af' }}>{formatCurrency(bill?.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
          <span style={{ color: '#16a34a' }}>Paid Amount</span>
          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatCurrency(bill?.paidAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', fontWeight: 'bold', borderTop: '1px dashed #d1d5db', marginTop: '4px' }}>
          <span style={{ color: bill?.balance > 0 ? '#dc2626' : '#16a34a' }}>Balance Due</span>
          <span style={{ color: bill?.balance > 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(bill?.balance)}</span>
        </div>
      </div>

      {/* Payment Status Badge */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', border: `2px solid ${paymentStatusColor}`, color: paymentStatusColor }}>
          {bill?.paymentStatus === 'paid' ? '✓ PAID' : bill?.paymentStatus === 'partial' ? 'PARTIAL' : 'PENDING'}
        </span>
        {bill?.paymentMethod && <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Payment Method: {bill.paymentMethod}</p>}
      </div>

      {bill?.notes && <p style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px', fontStyle: 'italic' }}>Note: {bill.notes}</p>}

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '1px dashed #d1d5db', paddingTop: '8px', marginTop: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '3px' }}>Thank you for trusting {labName}</p>
        <p style={{ fontSize: '9px', color: '#9ca3af' }}>Printed: {formatDate(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
    </div>
  );
}
