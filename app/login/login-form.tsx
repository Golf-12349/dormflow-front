"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  forgotPasswordAction,
  loginAction,
  resetPasswordAction,
  type AuthMutationState,
} from "@/lib/actions/auth";
import { ActionResultToast } from "@/components/providers/action-result-toast";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LoginFormState } from "@/types";

const INITIAL_LOGIN_STATE: LoginFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  email: "",
};

const INITIAL_MUTATION_STATE: AuthMutationState = {
  status: "idle",
  message: null,
};

const FIELD_BASE =
  "w-full rounded-xl border bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );
  const [forgotState, forgotFormAction, forgotPending] = useActionState(
    forgotPasswordAction,
    INITIAL_MUTATION_STATE,
  );
  const [resetState, resetFormAction, resetPending] = useActionState(
    resetPasswordAction,
    INITIAL_MUTATION_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");

  const emailError = state.fieldErrors.email;
  const passwordError = state.fieldErrors.password;

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5" noValidate>
      {notice ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {notice}
        </div>
      ) : null}
      <ActionResultToast state={state} />
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          {t.auth.emailLabel}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            placeholder="admin@dormhub.com"
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : undefined}
            className={cn(
              FIELD_BASE,
              "outline-none",
              emailError
                ? "border-rose-300 focus:border-rose-400"
                : "border-slate-200 focus:border-indigo-400",
            )}
          />
        </div>
        {emailError ? (
          <p id="email-error" className="text-xs font-medium text-rose-600">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          {t.auth.passwordLabel}
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={cn(
              FIELD_BASE,
              "pr-11 outline-none",
              passwordError
                ? "border-rose-300 focus:border-rose-400"
                : "border-slate-200 focus:border-indigo-400",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordError ? (
          <p id="password-error" className="text-xs font-medium text-rose-600">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            className="size-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
          />
          {t.auth.keepSignedIn}
        </label>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "forgot" : "login")}
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
          title={t.auth.forgotPasswordHint}
        >
          {t.auth.forgotPassword}
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t.auth.submitting}
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" />
            {t.auth.submit}
          </>
        )}
      </button>
      </form>

      {mode !== "login" ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
              {mode === "forgot"
                ? t.auth.recovery.requestTokenTitle
                : t.auth.recovery.resetTitle}
            </h3>
            <button
              type="button"
              onClick={() => setMode(mode === "forgot" ? "reset" : "forgot")}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              {mode === "forgot"
                ? t.auth.recovery.haveTokenSwitch
                : t.auth.recovery.requestTokenTitle}
            </button>
          </div>

          {mode === "forgot" ? (
            <div className="space-y-2.5">
              <input
                type="email"
                name="email"
                form="forgot-password-form"
                placeholder="admin@dormhub.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <button
                type="submit"
                form="forgot-password-form"
                disabled={forgotPending}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {t.auth.recovery.requestTokenSubmit}
              </button>
              {forgotState.message ? (
                <p
                  className={cn(
                    "text-xs font-medium",
                    forgotState.status === "error"
                      ? "text-rose-600"
                      : "text-emerald-700",
                  )}
                >
                  {forgotState.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2.5">
              <input
                type="email"
                name="email"
                form="reset-password-form"
                placeholder={t.auth.emailLabel}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="text"
                name="token"
                form="reset-password-form"
                placeholder={t.auth.recovery.tokenLabel}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="password"
                name="newPassword"
                form="reset-password-form"
                placeholder={t.auth.recovery.newPasswordLabel}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <input
                type="password"
                name="confirmPassword"
                form="reset-password-form"
                placeholder={t.auth.recovery.confirmPasswordLabel}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <button
                type="submit"
                form="reset-password-form"
                disabled={resetPending}
                className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {t.auth.recovery.resetSubmit}
              </button>
              {resetState.message ? (
                <p
                  className={cn(
                    "text-xs font-medium",
                    resetState.status === "error"
                      ? "text-rose-600"
                      : "text-emerald-700",
                  )}
                >
                  {resetState.message}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
      <form id="forgot-password-form" action={forgotFormAction} noValidate />
      <form id="reset-password-form" action={resetFormAction} noValidate />
    </div>
  );
}