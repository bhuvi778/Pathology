import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '-';
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

export const getStatusBadgeClass = (status) => {
  const map = {
    pending: 'badge-pending',
    sample_collected: 'badge-processing',
    processing: 'badge-processing',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    entered: 'badge-processing',
    verified: 'badge-completed',
    delivered: 'badge-completed',
    paid: 'badge-completed',
    partial: 'badge-pending',
  };
  return map[status] || 'badge-pending';
};

export const getStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    sample_collected: 'Sample Collected',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    entered: 'Results Entered',
    verified: 'Verified',
    delivered: 'Delivered',
    paid: 'Paid',
    partial: 'Partially Paid',
  };
  return map[status] || status;
};

export const getCategoryLabel = (cat) => {
  const map = {
    hematology: 'Hematology',
    biochemistry: 'Biochemistry',
    serology: 'Serology',
    urology: 'Urology',
    microbiology: 'Microbiology',
    hormones: 'Hormones',
    radiology: 'Radiology',
    cardiology: 'Cardiology',
    other: 'Other',
  };
  return map[cat] || cat;
};

export const getFlagColor = (flag) => {
  if (flag === 'H') return 'text-red-600 font-bold';
  if (flag === 'L') return 'text-blue-600 font-bold';
  if (flag === 'C') return 'text-purple-600 font-bold';
  return '';
};

export const calculateFlag = (value, range, gender = 'general') => {
  if (!value || !range) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  const r = range[gender] || range.general;
  if (!r) return '';
  if (r.max !== undefined && num > r.max) return 'H';
  if (r.min !== undefined && num < r.min) return 'L';
  return 'N';
};
