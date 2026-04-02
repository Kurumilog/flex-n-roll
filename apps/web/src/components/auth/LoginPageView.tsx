"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Buildings,
  Eye,
  EyeSlash,
  LockKey,
  SignIn,
  UserCircle,
} from "@phosphor-icons/react";
import { LoginRequestSchema } from "@flex-n-roll/shared-types";

import { useBitrixLoginMutation, useLoginMutation } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api/client";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("demo@flexnroll.ai");
  const [password, setPassword] = useState("demo12345");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const bitrixMutation = useBitrixLoginMutation();

  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const submitEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = LoginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Проверьте данные формы.");
      return;
    }

    setValidationError(null);
    try {
      await loginMutation.mutateAsync(parsed.data);
      router.replace(nextPath);
    } catch {
      // handled by mutation message block
    }
  };

  const submitBitrixLogin = async () => {
    setValidationError(null);
    try {
      await bitrixMutation.mutateAsync({});
      router.replace(nextPath);
    } catch {
      // handled by mutation message block
    }
  };

  const authError = validationError
    ?? (loginMutation.error ? getErrorMessage(loginMutation.error) : null)
    ?? (bitrixMutation.error ? getErrorMessage(bitrixMutation.error) : null);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--bg)] px-4 py-5 text-[var(--text)] sm:px-6 sm:py-7">
      <div className="pointer-events-none absolute left-[8%] top-[8%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,_rgba(38,66,139,0.18),_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[5%] right-[4%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,_rgba(44,139,103,0.16),_transparent_68%)]" />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <section className="surface-shell-dark p-2">
          <div className="surface-panel-dark flex h-full flex-col justify-between px-6 py-7 sm:px-8 sm:py-8">
            <div>
              <span className="eyebrow eyebrow-dark">
                <span className="status-dot-dark h-2.5 w-2.5 rounded-full" />
                FLEX-N-ROLL Access Layer
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                Вход в AI Control Center
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/74">
                Авторизуйся по почте и паролю или через Bitrix24. В текущем этапе это
                безопасные заглушки для UX и backend-каркаса, чтобы быстро перейти к полной интеграции.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <StatCard label="Routing uptime" value="99.7%" />
              <StatCard label="Median processing" value="14s" />
              <StatCard label="Auto-routed today" value="10 / 12" />
              <StatCard label="Escalations" value="1 open" />
            </div>
          </div>
        </section>

        <section className="surface-shell p-2">
          <div className="surface-panel h-full px-6 py-7 sm:px-8 sm:py-8">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Sign In
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--accent-deep)]">
                Рабочий доступ менеджера
              </h2>
            </div>

            <form onSubmit={submitEmailLogin} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--accent-deep)]">
                  Email
                </span>
                <div className="surface-inset flex min-h-11 items-center gap-3 px-3">
                  <UserCircle className="h-5 w-5 text-[var(--muted)]" weight="regular" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full border-0 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                    placeholder="manager@flexnroll.ai"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--accent-deep)]">
                  Password
                </span>
                <div className="surface-inset flex min-h-11 items-center gap-3 px-3">
                  <LockKey className="h-5 w-5 text-[var(--muted)]" weight="regular" />
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full border-0 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                    placeholder="Введите пароль"
                    required
                  />
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]"
                    onClick={() => setPasswordVisible((prev) => !prev)}
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {isPasswordVisible ? (
                      <EyeSlash className="h-5 w-5" weight="regular" />
                    ) : (
                      <Eye className="h-5 w-5" weight="regular" />
                    )}
                  </button>
                </div>
              </label>

              {authError ? (
                <p className="rounded-2xl border border-[rgba(198,93,73,0.28)] bg-[rgba(198,93,73,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
                  {authError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loginMutation.isPending || bitrixMutation.isPending}
                className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_34px_-20px_rgba(38,66,139,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-65"
              >
                <SignIn className="h-4 w-4" weight="regular" />
                {loginMutation.isPending ? "Входим..." : "Войти по email"}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/14 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" weight="regular" />
                </span>
              </button>
            </form>

            <div className="my-5 divider-line" />

            <button
              type="button"
              disabled={loginMutation.isPending || bitrixMutation.isPending}
              onClick={submitBitrixLogin}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--accent-deep)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px disabled:opacity-65"
            >
              <Buildings className="h-4 w-4" weight="regular" />
              {bitrixMutation.isPending ? "Подключаем..." : "Войти через Bitrix24"}
            </button>

            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              Демо-доступ: <strong className="text-[var(--accent-deep)]">demo@flexnroll.ai</strong> /
              {" "}
              <strong className="text-[var(--accent-deep)]">demo12345</strong>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-inset-dark px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/64">{label}</p>
      <p className="metric-value mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
