import { AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/storeHooks';
import { clearPendingConfirm, runPendingConfirm } from './confirmModalController';
import { closeConfirmModal } from '../features/activeScrum/scrumSlice';
// import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
// import { closeConfirmModal } from '../../features/activeScrum/scrumSlice';
// import { runPendingConfirm, clearPendingConfirm } from './confirmModalController';

// Ek hi baar app me mount karna hai (ProjectLayout me) — jo bhi confirmModal
// Redux state open karega, ye khud-ba-khud dikh jayega. Koi bhi page/component
// dispatch(openConfirmModal(...)) + setPendingConfirm(...) se ise trigger kar sakta hai.
export const GlobalConfirmModal = () => {
  const dispatch = useAppDispatch();
  const { isOpen, title, message } = useAppSelector((s) => s.scrum.confirmModal);

  if (!isOpen) return null;

  const handleCancel = () => {
    clearPendingConfirm();
    dispatch(closeConfirmModal());
  };

  const handleConfirm = () => {
    runPendingConfirm();
    dispatch(closeConfirmModal());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={handleCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalConfirmModal;