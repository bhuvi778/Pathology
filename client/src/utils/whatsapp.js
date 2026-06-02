// WhatsApp Sharing Utility
export const shareReportOnWhatsApp = (report, labName = 'Lab') => {
  const message = `
📋 *Lab Report Generated*

👤 *Patient:* ${report.patient?.name}
🆔 *Patient ID:* ${report.patient?.patientId}
🧪 *Test:* ${report.test?.name}
📑 *Report ID:* ${report.reportId}
📊 *Status:* ${report.status}
📅 *Date:* ${new Date(report.reportDate).toLocaleDateString()}

${report.remarks ? `💬 *Remarks:* ${report.remarks}` : ''}

Please login to your portal to view the detailed report.
  `.trim();

  const encoded = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/?text=${encoded}`;
  window.open(whatsappLink, '_blank');
};

// Share multiple reports
export const shareMultipleReportsOnWhatsApp = (reports, labName = 'Lab') => {
  const message = `
📋 *Lab Reports - Batch Delivery*

Reports Generated: ${reports.length}

${reports.map((r, i) => `${i + 1}. ${r.patient?.name} - ${r.test?.name} (${r.reportId})`).join('\n')}

Please login to your portal to view all reports.
  `.trim();

  const encoded = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/?text=${encoded}`;
  window.open(whatsappLink, '_blank');
};

// Send to specific number
export const shareReportViaWhatsAppNumber = (report, phoneNumber) => {
  const message = `
📋 *Lab Report Generated*

👤 *Patient:* ${report.patient?.name}
🆔 *Patient ID:* ${report.patient?.patientId}
🧪 *Test:* ${report.test?.name}
📑 *Report ID:* ${report.reportId}
📊 *Status:* ${report.status}
  `.trim();

  const encoded = encodeURIComponent(message);
  // Remove any non-digit characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encoded}`;
  window.open(whatsappLink, '_blank');
};

export default {
  shareReportOnWhatsApp,
  shareMultipleReportsOnWhatsApp,
  shareReportViaWhatsAppNumber,
};
