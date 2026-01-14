import { toast } from "sonner";

interface AsyncToastOptions {
  loading: string;
  success: string | ((result: any) => string);
  error?: string | ((err: any) => string);
}

export async function withAsyncToast<T>(
  asyncFn: () => Promise<T>,
  options: AsyncToastOptions
): Promise<T> {
  const toastId = toast.loading(options.loading);
  
  try {
    const result = await asyncFn();
    toast.dismiss(toastId);
    const successMsg = typeof options.success === 'function' 
      ? options.success(result) 
      : options.success;
    toast.success(successMsg);
    return result;
  } catch (err: any) {
    toast.dismiss(toastId);
    const errorMsg = options.error 
      ? (typeof options.error === 'function' ? options.error(err) : options.error)
      : (err.message || "Operation failed");
    if (errorMsg) {
      toast.error(errorMsg);
    }
    throw err;
  }
}

export async function withAsyncToastCancellable<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  options: AsyncToastOptions & { cancelled?: string }
): Promise<{ result: T; cancel: () => void } | null> {
  const controller = new AbortController();
  const toastId = toast.loading(options.loading);
  
  const cancel = () => {
    controller.abort();
    toast.dismiss(toastId);
    toast.info(options.cancelled || "Cancelled");
  };

  try {
    const result = await asyncFn(controller.signal);
    toast.dismiss(toastId);
    const successMsg = typeof options.success === 'function' 
      ? options.success(result) 
      : options.success;
    toast.success(successMsg);
    return { result, cancel };
  } catch (err: any) {
    toast.dismiss(toastId);
    if (err.name === 'AbortError') {
      return null;
    }
    const errorMsg = options.error 
      ? (typeof options.error === 'function' ? options.error(err) : options.error)
      : (err.message || "Operation failed");
    toast.error(errorMsg);
    throw err;
  }
}
