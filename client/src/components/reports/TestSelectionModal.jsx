import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';

export default function TestSelectionModal({
  open,
  report,
  actionLabel = 'continue',
  onClose,
  onConfirm,
}) {
  const tests = useMemo(() => {
    if (Array.isArray(report?.tests) && report.tests.length) return report.tests;
    if (report?.test) return [report.test];
    return [];
  }, [report]);

  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [pageMode, setPageMode] = useState('single-page');

  useEffect(() => {
    if (!open) {
      setSelectedTestIds([]);
      setPageMode('single-page');
    }
  }, [open, report?._id]);

  if (!open) return null;

  const canConfirm = selectedTestIds.length > 0;

  const toggleTest = (testId) => {
    setSelectedTestIds((current) => {
      if (current.includes(testId)) return current.filter((id) => id !== testId);
      return [...current, testId];
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Tests" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Multiple tests are available in this report. Choose one or more tests before {actionLabel}.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tests.map((test) => {
            const testId = String(test?._id || test);
            return (
              <label key={testId} className="flex items-start gap-3 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  value={testId}
                  checked={selectedTestIds.includes(testId)}
                  onChange={() => toggleTest(testId)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-slate-800">{test?.name || 'Unnamed test'}</p>
                  {test?.sampleType && <p className="text-xs text-slate-500">{test.sampleType}</p>}
                </div>
              </label>
            );
          })}
        </div>

        <div className="space-y-2 border border-slate-200 rounded-lg p-3">
          <p className="text-sm font-medium text-slate-800">Page Layout</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="pageMode"
              value="single-page"
              checked={pageMode === 'single-page'}
              onChange={(event) => setPageMode(event.target.value)}
            />
            Combine selected tests in one report layout
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="pageMode"
              value="separate-pages"
              checked={pageMode === 'separate-pages'}
              onChange={(event) => setPageMode(event.target.value)}
            />
            Print or share each selected test on separate page
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onConfirm({ selectedTestIds, pageMode })}
            disabled={!canConfirm}
            className="btn-primary disabled:opacity-50"
          >
            {actionLabel === 'share' ? 'Share Selected Tests' : 'Print Selected Tests'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
