import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import BillPrint from '../components/billing/BillPrint';
import { getStoredLabSettings } from './pdf';

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
};

const renderBillToContainer = async (bill, options = {}) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '600px';
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(BillPrint, {
    bill,
    renderMode: options.renderMode || 'print',
    labSettingsOverride: options.labSettings || getStoredLabSettings(),
  }));

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(container);

  return {
    container,
    cleanup: () => {
      root.unmount();
      container.remove();
    },
  };
};

const buildPdfFromCanvas = (canvas) => {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
};

export const generateBillPdfFilename = (bill) => {
  const date = new Date(bill?.createdAt || Date.now()).toISOString().split('T')[0];
  return `Bill_${bill?.billId || 'UNKNOWN'}_${bill?.patient?.patientId || 'PATIENT'}_${date}.pdf`;
};

export const createBillPdfBlob = async (bill, options = {}) => {
  const { container, cleanup } = await renderBillToContainer(bill, options);
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });
    const pdf = buildPdfFromCanvas(canvas);
    return pdf.output('blob');
  } finally {
    cleanup();
  }
};

export const createBillPdfFile = async (bill, options = {}) => {
  const blob = await createBillPdfBlob(bill, options);
  return new File([blob], generateBillPdfFilename(bill), { type: 'application/pdf' });
};

const triggerFileDownload = (file) => {
  const url = URL.createObjectURL(file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name || 'bill.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportBillToPDF = async (bill, options = {}) => {
  try {
    const file = await createBillPdfFile(bill, {
      renderMode: 'print',
      ...options,
    });
    triggerFileDownload(file);
    return true;
  } catch (error) {
    console.error('Error exporting bill PDF:', error);
    return false;
  }
};

export const printBill = async (bill, options = {}) => {
  const { container, cleanup } = await renderBillToContainer(bill, {
    renderMode: 'print',
    ...options,
  });

  try {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return false;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill-${bill?.billId || ''}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            html, body { margin: 0; padding: 0; background: #fff !important; }
            body { font-family: Arial, sans-serif; }
            .bill-print-root,
            .bill-print-root * {
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            @media print {
              html, body {
                margin: 0;
                padding: 0;
                background: #fff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .bill-print-root {
                margin: 0;
                padding: 0;
              }
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          <div class="bill-print-root">${container.innerHTML}</div>
          <script>
            window.print();
            setTimeout(() => window.close(), 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    return true;
  } catch (error) {
    console.error('Error printing bill:', error);
    return false;
  } finally {
    cleanup();
  }
};

export default {
  createBillPdfBlob,
  createBillPdfFile,
  exportBillToPDF,
  generateBillPdfFilename,
  printBill,
};
