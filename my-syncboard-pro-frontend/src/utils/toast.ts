export type ToastType = 'success' | 'error' | 'info';

export type ToastPayload = {
  message: string;
  type?: ToastType;
};

export const showToast = (message: string, type: ToastType = 'error') => {
  window.dispatchEvent(new CustomEvent<ToastPayload>('app:toast', {
    detail: { message, type },
  }));
};
