"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { UpdateProfileRequest } from "@flex-n-roll/shared-types";
import { UserCircle } from "@phosphor-icons/react";

import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { getErrorMessage } from "@/lib/api/client";

export function ProfileSettingsCard() {
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfile();
  const [form, setForm] = useState<UpdateProfileRequest>({
    name: "",
    department: "",
    timezone: "",
    bio: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQuery.data?.profile) {
      return;
    }

    setForm({
      name: profileQuery.data.profile.name,
      department: profileQuery.data.profile.department,
      timezone: profileQuery.data.profile.timezone,
      bio: profileQuery.data.profile.bio ?? "",
    });
  }, [profileQuery.data?.profile]);

  if (profileQuery.isLoading) {
    return (
      <section className="surface-shell p-2">
        <div className="surface-panel space-y-3 px-6 py-6">
          <div className="h-7 w-40 animate-pulse rounded-full bg-[var(--surface-soft)]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
          <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
        </div>
      </section>
    );
  }

  if (profileQuery.isError || !profileQuery.data?.profile) {
    return (
      <section className="surface-shell p-2">
        <div className="surface-panel px-6 py-6">
          <p className="text-sm text-[var(--danger)]">
            {getErrorMessage(profileQuery.error, "Не удалось загрузить профиль.")}
          </p>
        </div>
      </section>
    );
  }

  const profile = profileQuery.data.profile;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      await updateMutation.mutateAsync({
        name: form.name,
        department: form.department,
        timezone: form.timezone,
        bio: form.bio,
      });
      setFeedback("Профиль сохранён.");
    } catch (error) {
      setFeedback(getErrorMessage(error, "Не удалось обновить профиль."));
    }
  };

  return (
    <section className="surface-shell p-2">
      <div className="surface-panel px-6 py-6 sm:px-7">
        <div className="flex flex-wrap items-center gap-4">
          <div className="surface-inset inline-flex h-14 w-14 items-center justify-center rounded-full">
            <UserCircle className="h-7 w-7 text-[var(--accent)]" weight="regular" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Profile</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[var(--accent-deep)]">
              Личный кабинет
            </h2>
          </div>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <FormField label="Имя">
            <input
              type="text"
              className="h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none ring-0"
              value={form.name ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)] outline-none ring-0"
              value={profile.email}
              disabled
            />
          </FormField>

          <FormField label="Роль">
            <input
              type="text"
              className="h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--muted)] outline-none ring-0"
              value={profile.role}
              disabled
            />
          </FormField>

          <FormField label="Отдел">
            <input
              type="text"
              className="h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none ring-0"
              value={form.department ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, department: event.target.value }))
              }
              required
            />
          </FormField>

          <FormField label="Часовой пояс">
            <input
              type="text"
              className="h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none ring-0"
              value={form.timezone ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, timezone: event.target.value }))
              }
              required
            />
          </FormField>

          <FormField label="Bio">
            <textarea
              className="min-h-24 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none ring-0"
              value={form.bio ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              maxLength={280}
            />
          </FormField>

          <div className="sm:col-span-2">
            {feedback ? (
              <p className="mb-3 text-sm text-[var(--accent-deep)]">{feedback}</p>
            ) : null}
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-60"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--accent-deep)]">{label}</span>
      {children}
    </label>
  );
}
