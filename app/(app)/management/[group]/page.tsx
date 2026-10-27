import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ManagementGroupCards } from "@/components/management/management-group-cards";
import { MasterDataManager } from "@/components/management/master-data-manager";
import { getRoomCreationOptions } from "@/lib/api/dormflow";
import { t } from "@/lib/i18n";
import { MANAGEMENT_GROUPS, getManagementGroup } from "@/lib/management";

export function generateStaticParams() {
  return MANAGEMENT_GROUPS.map(({ slug }) => ({ group: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group: slug } = await params;
  const group = getManagementGroup(slug);
  return { title: group?.title ?? "Management" };
}

export default async function ManagementGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;
  const group = getManagementGroup(slug);
  if (!group) notFound();

  const Icon = group.icon;
  const masterDataOptions =
    slug === "properties" ? await getRoomCreationOptions() : null;

  return (
    <section className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t.nav.overview}
      </Link>
      <header className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl leading-snug font-semibold tracking-tight text-slate-900">
            {group.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-500">{group.description}</p>
        </div>
      </header>
      {masterDataOptions ? (
        <MasterDataManager options={masterDataOptions} embedded />
      ) : null}
      <ManagementGroupCards group={group} />
    </section>
  );
}
