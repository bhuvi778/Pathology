import { getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';

export default function Badge({ status, label, color }) {
  if (color) {
    const colorMap = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      amber: 'bg-amber-100 text-amber-800',
      purple: 'bg-purple-100 text-purple-800',
      slate: 'bg-slate-100 text-slate-700',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || 'bg-slate-100 text-slate-700'}`}>
        {label}
      </span>
    );
  }
  return (
    <span className={getStatusBadgeClass(status)}>
      {label || getStatusLabel(status)}
    </span>
  );
}
