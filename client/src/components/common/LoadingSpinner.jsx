export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeMap[size]}`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
