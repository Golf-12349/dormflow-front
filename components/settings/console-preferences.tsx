"use client";

import { useSyncExternalStore } from "react";
import { BellRing, Moon, Sun } from "lucide-react";

import { useDarkTheme, useToast } from "@/components/providers/app-feedback-provider";
import { t } from "@/lib/i18n";

function preferenceKey(userId: string, preference: string) {
  return `dormflow-preference:${userId}:${preference}`;
}

function subscribePreference(
  userId: string,
  preference: string,
  callback: () => void,
) {
  const key = preferenceKey(userId, preference);
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(key, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(key, callback);
  };
}

function getPreferenceSnapshot(userId: string, preference: string) {
  return window.localStorage.getItem(preferenceKey(userId, preference)) !== "false";
}

function getServerPreferenceSnapshot() {
  return true;
}

function useNotificationPreference(userId: string, preference: string) {
  const enabled = useSyncExternalStore(
    (callback) => subscribePreference(userId, preference, callback),
    () => getPreferenceSnapshot(userId, preference),
    getServerPreferenceSnapshot,
  );

  const setEnabled = (nextEnabled: boolean) => {
    window.localStorage.setItem(
      preferenceKey(userId, preference),
      String(nextEnabled),
    );
    window.dispatchEvent(new Event(preferenceKey(userId, preference)));
  };

  return [enabled, setEnabled] as const;
}

export function ConsolePreferences({ userId }: { userId: string }) {
  const [dark, setDark] = useDarkTheme();
  const notify = useToast();
  const [overdueInvoices, setOverdueInvoices] = useNotificationPreference(
    userId,
    "overdue-invoices",
  );
  const [expiringLeases, setExpiringLeases] = useNotificationPreference(
    userId,
    "expiring-leases",
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 size-5 text-indigo-600" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.settings.notifications.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.settings.notifications.description}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <PreferenceToggle
            title={t.settings.notifications.overdue}
            description={t.settings.notifications.overdueDescription}
            enabled={overdueInvoices}
            onChange={(enabled) => {
              setOverdueInvoices(enabled);
              notify("success", t.settings.notifications.saved);
            }}
          />
          <PreferenceToggle
            title={t.settings.notifications.leases}
            description={t.settings.notifications.leasesDescription}
            enabled={expiringLeases}
            onChange={(enabled) => {
              setExpiringLeases(enabled);
              notify("success", t.settings.notifications.saved);
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          {dark ? (
            <Moon className="mt-0.5 size-5 text-indigo-600" aria-hidden="true" />
          ) : (
            <Sun className="mt-0.5 size-5 text-amber-500" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.settings.theme.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.settings.theme.description}
            </p>
          </div>
        </div>
        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <span className="text-sm font-medium text-slate-700">
            {dark ? t.settings.theme.darkEnabled : t.settings.theme.light}
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={dark}
            aria-label={t.settings.theme.dark}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;
              setDark(enabled);
              notify(
                "success",
                enabled
                  ? t.settings.theme.darkEnabled
                  : t.settings.theme.darkDisabled,
              );
            }}
            className="size-5 accent-indigo-600"
          />
        </label>
      </section>
    </div>
  );
}

function PreferenceToggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={enabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-0.5 size-5 shrink-0 accent-indigo-600"
      />
    </label>
  );
}
