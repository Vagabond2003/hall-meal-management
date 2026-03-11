"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, UtensilsCrossed, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">Invalid Link</h1>
        <p className="text-text-secondary mb-8 leading-relaxed">
          This reset link is invalid or missing. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-light transition-colors"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(true);
        toast.success("Password updated successfully!");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">Password Updated!</h1>
        <p className="text-text-secondary mb-2 leading-relaxed">
          Your password has been changed successfully.
        </p>
        <p className="text-text-secondary text-sm mb-8">Redirecting to login in 2 seconds…</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-light transition-colors"
        >
          Go to Login Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Set New Password</h1>
        <p className="text-text-secondary">
          Choose a strong new password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            {(error.includes("expired") || error.includes("already been used") || error.includes("Invalid")) && (
              <Link href="/forgot-password" className="underline font-medium mt-1 inline-block">
                Request a new link →
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary block">New Password</label>
          <div className="relative">
            <input
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              className="w-full h-12 pl-10 pr-4 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white dark:bg-surface disabled:opacity-60"
            />
            <Lock className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary block">Confirm Password</label>
          <div className="relative">
            <input
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full h-12 pl-10 pr-4 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white dark:bg-surface disabled:opacity-60"
            />
            <Lock className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary-light transition-all shadow-btn-hover btn-hover disabled:opacity-60 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      <p className="text-center text-text-secondary mt-8">
        Remember your password?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[40%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-light rounded-full mix-blend-screen filter blur-3xl animate-bokeh" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#2E7D52] rounded-full mix-blend-screen filter blur-3xl animate-bokeh stagger-2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-16">
            <UtensilsCrossed className="w-8 h-8 text-accent-gold" />
            <span className="font-heading text-xl font-bold tracking-wider">HALL MEAL HUB</span>
          </div>

          <h2 className="font-heading text-4xl lg:text-5xl text-white font-bold leading-tight mb-6">
            Create a New Password
          </h2>
          <p className="text-primary-muted font-body text-lg italic">
            &ldquo;Your account security matters to us.&rdquo;
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Encrypted</span>
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Secure</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-up">
          <Suspense fallback={<div className="h-64 animate-shimmer rounded-xl" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
