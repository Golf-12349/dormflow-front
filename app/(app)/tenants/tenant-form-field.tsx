/**
 * Label + input row shared by the Phase 6.5 tenant mutation forms (add
 * tenant above the table, edit contact in the profile drawer).
 *
 * Uncontrolled by design: the action result arrives via `useActionState`, and
 * the edit form seeds existing values through `defaultValue`.
 */
interface TenantFormFieldProps {
  id: string;
  name: string;
  label: string;
  /** Defaults to `text`. */
  type?: string;
  /** Pre-fills an existing value (edit form); omitted for blank add-form fields. */
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}

export function TenantFormField({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  autoComplete,
  required = true,
}: TenantFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none focus:border-indigo-400"
      />
    </div>
  );
}