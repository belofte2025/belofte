"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import PetrosBrand from "@/components/layout/PetrosBrand";
import { login } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
      router.replace("/dashboard");
    } catch {
      setError("Sign-in failed. Check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-[#f4f7f6] lg:grid-cols-[0.95fr_1.05fr]">
      <div className="flex min-w-0 flex-col px-5 py-5 sm:px-10 lg:px-12 lg:py-8">
        <PetrosBrand />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="mb-7">
            <h1 className="text-4xl font-bold tracking-[-0.055em] text-[#102f2f]">Sign in</h1>
            <p className="mt-2 text-sm text-gray-600">Use your company account to access PETROS.</p>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input id="login-email" className="input text-base" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input id="login-password" className="input pr-14 text-base" type={secure ? "password" : "text"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-gray-600 hover:text-blue-700"
                  aria-label={secure ? "Show password" : "Hide password"}
                  onClick={() => setSecure(!secure)}
                >
                  {secure ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <><LoaderCircle className="size-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <Link href="/" className="mt-7 inline-flex w-fit items-center gap-2 rounded text-sm text-gray-600 hover:text-blue-700">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
        <a href="tel:+233246462398" className="w-fit text-xs text-gray-600 hover:underline">EYO Solutions support · 0246462398</a>
      </div>
      <div className="relative m-4 hidden overflow-hidden rounded-3xl bg-[#102f2f] lg:block">
        <Image src="/warehouse-imge.png" alt="" fill priority sizes="52vw" className="object-cover object-[32%_center]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#092625]/95 via-[#092625]/30 to-transparent" />
        <p className="absolute inset-x-0 bottom-0 max-w-xl p-10 text-[clamp(2rem,3.5vw,3.5rem)] leading-[1.03] font-semibold tracking-[-0.055em] text-white xl:p-14">
          Warehouse and sales operations in one workspace.
        </p>
      </div>
    </main>
  );
}
