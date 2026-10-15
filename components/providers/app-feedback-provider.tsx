"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

import { t } from "@/lib/i18n";
export type ToastKind = "success" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  notify: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const THEME_STORAGE_KEY = "dormflow-theme";
const THEME_CHANGE_EVENT = "dormflow-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return false;
}

export function useDarkTheme(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const setEnabled = useCallback((nextEnabled: boolean) => {
    document.documentElement.classList.toggle("dark", nextEnabled);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextEnabled ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return [enabled, setEnabled];
}

export function AppFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const enabled = window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
    document.documentElement.classList.toggle("dark", enabled);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const contextValue = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const Icon = toast.kind === "success" ? CheckCircle2 : CircleAlert;
          return (
            <div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-xl border bg-white p-4 text-sm shadow-lg ${
                toast.kind === "success"
                  ? "border-emerald-200 text-emerald-800"
                  : "border-rose-200 text-rose-800"
              }`}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                  )
                }
                aria-label={t.settings.closeToast}
                className="rounded p-0.5 opacity-60 transition hover:opacity-100"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside AppFeedbackProvider.");
  }
  return context.notify;
}
