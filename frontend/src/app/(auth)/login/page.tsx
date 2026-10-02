"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/axios";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? [err.message]);
      } else {
        setErrors(["Đăng nhập thất bại."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6 bg-card border-border"
      >
        <h1 className="text-xl font-semibold text-foreground">Đăng nhập</h1>

        {errors.length > 0 && (
          <ul className="rounded bg-danger-bg border border-danger-border p-3 text-sm text-danger">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-card focus:outline-none focus:border-brand"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-card focus:outline-none focus:border-brand"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand hover:bg-brand-hover active:bg-brand-active py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}