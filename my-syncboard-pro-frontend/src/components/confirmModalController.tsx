// Redux me sirf UI state (isOpen/title/message) rakhte hain kyunki wo serializable hai.
// "Confirm hone par kya karna hai" (function) yahan module-level variable me rakhte hain.

let pendingConfirmCallback: (() => void) | null = null;

export const setPendingConfirm = (callback: () => void) => {
  pendingConfirmCallback = callback;
};

export const runPendingConfirm = () => {
  pendingConfirmCallback?.();
  pendingConfirmCallback = null;
};

export const clearPendingConfirm = () => {
  pendingConfirmCallback = null;
};