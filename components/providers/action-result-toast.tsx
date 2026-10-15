"use client";

import { useEffect, useRef } from "react";

import { useToast } from "./app-feedback-provider";

export function ActionResultToast({
  state,
}: {
  state: { status: string; message: string | null };
}) {
  const notify = useToast();
  const lastResult = useRef(state);

  useEffect(() => {
    if (state === lastResult.current) return;
    lastResult.current = state;

    const { status, message } = state;
    if ((status !== "success" && status !== "error") || !message) return;

    if (status === "success" || status === "error") notify(status, message);
  }, [notify, state]);

  return null;
}
