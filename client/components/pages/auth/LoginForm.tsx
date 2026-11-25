"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import PetrosBrand from "@/components/layout/PetrosBrand";
import { login } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import styles from "./LoginForm.module.css";

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
    <main className={styles.screen}>
      <div className={styles.content}>
        <section className={styles.card} aria-labelledby="login-title">
          <div className="mb-7">
            <PetrosBrand />
            <h1 id="login-title" className="mt-6 text-4xl font-bold tracking-[-0.055em] text-[#102f2f]">Sign in</h1>
            <p className="mt-2 text-sm text-gray-600">Use your company account to access PETROS.</p>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input id="login-email" className="input text-base" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className={styles.password}>
                <input id="login-password" className="input text-base" type={secure ? "password" : "text"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
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
              {loading ? <><LoaderCircle className="size-4 motion-safe:animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <div className="mt-6 border-t border-gray-200 pt-4 text-sm">
            <Link href="/onboard" className="font-semibold text-blue-700 hover:underline">Set up a company</Link>
          </div>
        </section>
        <div className={styles.developer}>
          <Image src="/icon/eyo.png" alt="" width={48} height={36} className={styles.developerLogo} />
          <div>
            <p>Developed by EYO Solutions</p>
            <a href="tel:+233246462398" className={styles.support}>Support · 0246462398</a>
          </div>
        </div>
      </div>
    </main>
  );
}
