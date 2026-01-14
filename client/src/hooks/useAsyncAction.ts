import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export type AsyncActionState = "idle" | "loading" | "complete" | "error";

export interface ToastMessages<T> {
  loading: string;
  success: string | ((result: T) => string);
  error?: string | ((err: Error) => string | null);
  cancelled?: string;
}

export interface UseAsyncActionResult<T> {
  state: AsyncActionState;
  error: string | null;
  result: T | null;
  execute: () => Promise<T | null>;
  cancel: () => void;
  reset: () => void;
}

export function useAsyncAction<T>(
  asyncFn: (signal: AbortSignal) => Promise<T>,
  messages: ToastMessages<T>
): UseAsyncActionResult<T> {
  const [state, setState] = useState<AsyncActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  
  const asyncFnRef = useRef(asyncFn);
  const messagesRef = useRef(messages);
  
  asyncFnRef.current = asyncFn;
  messagesRef.current = messages;

  const execute = useCallback(async (): Promise<T | null> => {
    setState("loading");
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const currentMessages = messagesRef.current;
    const toastId = toast.loading(currentMessages.loading);

    try {
      const res = await asyncFnRef.current(controller.signal);
      toast.dismiss(toastId);
      const successMsg = typeof currentMessages.success === "function" 
        ? currentMessages.success(res) 
        : currentMessages.success;
      toast.success(successMsg);
      setResult(res);
      setState("complete");
      return res;
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const e = err instanceof Error ? err : new Error(String(err));

      if (e.name === "AbortError") {
        toast.info(currentMessages.cancelled || "Cancelled");
        setState("idle");
        return null;
      }

      const errorMsg = currentMessages.error
        ? typeof currentMessages.error === "function" ? currentMessages.error(e) : currentMessages.error
        : e.message || "Operation failed";

      if (errorMsg) {
        toast.error(errorMsg);
        setError(errorMsg);
      }
      setState("error");
      return null;
    } finally {
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return { state, error, result, execute, cancel, reset };
}
