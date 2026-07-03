import Modal from './Modal';
import { useMemo } from 'react';

export default function PrintOptionsModal({ open, onClose, options, setOptions, onConfirm }) {
  const headerDescription = useMemo(
    () => options.includeHeader ? 'Header will be included on the report printout.' : 'Header will be excluded from the report printout.',
    [options.includeHeader]
  );
  const footerDescription = useMemo(
    () => options.includeFooter ? 'Footer note and generated timestamp will be included.' : 'Footer note and generated timestamp will be excluded.',
    [options.includeFooter]
  );

  return (
    <Modal open={open} onClose={onClose} title="Print Options" size="sm">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Choose how report print should be rendered.</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl">
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">Include Header</p>
              <p className="text-sm text-slate-500">{headerDescription}</p>
            </div>
            <input
              type="checkbox"
              checked={options.includeHeader}
              onChange={(e) => setOptions(prev => ({ ...prev, includeHeader: e.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl">
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">Include Footer</p>
              <p className="text-sm text-slate-500">{footerDescription}</p>
            </div>
            <input
              type="checkbox"
              checked={options.includeFooter}
              onChange={(e) => setOptions(prev => ({ ...prev, includeFooter: e.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-primary">Print with Options</button>
        </div>
      </div>
    </Modal>
  );
}
