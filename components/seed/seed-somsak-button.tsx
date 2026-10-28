"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { seedSomsakAction } from "@/lib/actions/seed";
import { useRouter } from "next/navigation";

export function SeedSomsakButton({
  variant = "compact",
}: {
  variant?: "compact" | "banner";
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSeed = async () => {
    setLoading(true);
    setStatus("idle");
    setMessage(null);

    try {
      const result = await seedSomsakAction();
      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        router.refresh();
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "banner") {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-purple-50/50 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <h3 className="font-semibold text-slate-900 text-sm">
              ສ້າງຂໍ້ມູນຈຳລອງ (Simulate Demo Data)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            ບັນທຶກຂໍ້ມູນ ທ້າວ ສົມສັກ ວົງວິໄລ, ຫ້ອງ 201 (ອາຄານ A), ສັນຍາເຊົ່າ ແລະ ໃບບິນ 1,685,000 LAK ເຂົ້າ Database ທັນທີ
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              ກຳລັງສ້າງຂໍ້ມູນ...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-300" />
              ສຳເລັດແລ້ວ!
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              ສ້າງຂໍ້ມູນ ທ້າວ ສົມສັກ & ຫ້ອງ 201
            </>
          )}
        </button>
        {message ? (
          <div
            className={`w-full text-xs font-medium p-2 rounded-lg mt-2 ${
              status === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {message}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:opacity-50"
        title="ສ້າງຂໍ້ມູນ ທ້າວ ສົມສັກ ວົງວິໄລ ແລະ ຫ້ອງ 201 ເຂົ້າ Database"
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            ກຳລັງສ້າງ...
          </>
        ) : (
          <>
            <Sparkles className="size-3.5 text-indigo-600" />
            ສ້າງຂໍ້ມູນ ທ້າວ ສົມສັກ (Seed)
          </>
        )}
      </button>
      {message ? (
        <span
          className={`text-xs ${
            status === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}

