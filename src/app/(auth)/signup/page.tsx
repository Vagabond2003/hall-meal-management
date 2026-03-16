"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Ticket,
  UtensilsCrossed, ArrowRight, Loader2, CheckCircle2, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

type SignupMode = "student" | "admin";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [signupMode, setSignupMode] = useState<SignupMode>("student");

  // Form state
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [adminSecretCode, setAdminSecretCode] = useState("");

  // Error state
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [adminSecretError, setAdminSecretError] = useState("");

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setInviteCodeError("");
    setEmailError("");
    setAdminSecretError("");

    let hasError = false;
    if (!inviteCode.trim()) {
      setInviteCodeError("Invite code is required");
      hasError = true;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("A valid email is required");
      hasError = true;
    }
    if (signupMode === "admin" && !adminSecretCode.trim()) {
      setAdminSecretError("Admin secret code is required");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          email,
          signupMode,
          adminSecretCode: signupMode === "admin" ? adminSecretCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send verification link.");
        setIsLoading(false);
        return;
      }

      toast.success("Verification link sent!");
      setIsSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex w-[40%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated bokeh bubbles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-light rounded-full mix-blend-screen filter blur-3xl animate-bokeh"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#2E7D52] rounded-full mix-blend-screen filter blur-3xl animate-bokeh stagger-2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-16">
            <UtensilsCrossed className="w-8 h-8 text-accent-gold" />
            <span className="font-heading text-xl font-bold tracking-wider">ONLINE HALL MEAL MANAGER</span>
          </div>

          <h2 className="font-heading text-4xl lg:text-5xl text-white font-bold leading-tight mb-8">
            {signupMode === "admin" ? "Admin Registration" : "Get Started in 3 Steps"}
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-gold text-primary font-bold shrink-0">1</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">Verify Email</h3>
                <p className="text-primary-muted font-body">
                  {signupMode === "admin"
                    ? "Enter invite code, email, and admin secret code."
                    : "Enter your invite code and email address."}
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start opacity-60">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold shrink-0">2</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">Complete Profile</h3>
                <p className="text-primary-muted font-body">Fill in your name, password and token number.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start opacity-60">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold shrink-0">3</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">
                  {signupMode === "admin" ? "Start Managing" : "Wait for Approval"}
                </h3>
                <p className="text-primary-muted font-body">
                  {signupMode === "admin"
                    ? "Your admin account is auto-approved. Start right away."
                    : "Admin will review and activate your account."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">
                  {signupMode === "admin" ? "Admin Signup" : "Join the Hall"}
                </h1>
                <p className="text-text-secondary">
                  {signupMode === "admin"
                    ? "Register as an administrator"
                    : "Enter your invite code and email to get started"}
                </p>
              </div>

              {/* Student / Admin Toggle */}
              <div className="flex bg-slate-100 dark:bg-[#1F2B20] rounded-xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setSignupMode("student"); setAdminSecretCode(""); setAdminSecretError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    signupMode === "student"
                      ? "bg-white dark:bg-[#182218] text-primary shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setSignupMode("admin")}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    signupMode === "admin"
                      ? "bg-white dark:bg-[#182218] text-primary shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </button>
              </div>

              <form onSubmit={handleSendVerification} className="space-y-6">
                <div className="space-y-2 animate-fade-in stagger-1">
                  <label className="text-sm font-medium text-text-primary block">Invite Code</label>
                  <div className="relative">
                    <Input
                      disabled={isLoading}
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase());
                        if (inviteCodeError) setInviteCodeError("");
                      }}
                      type="text"
                      placeholder="e.g. ABCD2345"
                      className={`pl-10 h-12 font-mono uppercase tracking-widest ${inviteCodeError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <Ticket className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {inviteCodeError && <p className="text-red-500 text-xs mt-1">{inviteCodeError}</p>}
                </div>

                <div className="space-y-2 animate-fade-in stagger-2">
                  <label className="text-sm font-medium text-text-primary block">Email Address</label>
                  <div className="relative">
                    <Input
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      type="email"
                      placeholder="john@gmail.com"
                      className={`pl-10 h-12 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <Mail className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>

                {/* Admin Secret Code field — only shown for admin mode */}
                {signupMode === "admin" && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-medium text-text-primary block">Admin Secret Code</label>
                    <div className="relative">
                      <Input
                        disabled={isLoading}
                        value={adminSecretCode}
                        onChange={(e) => {
                          setAdminSecretCode(e.target.value);
                          if (adminSecretError) setAdminSecretError("");
                        }}
                        type="password"
                        placeholder="Enter admin secret code"
                        className={`pl-10 h-12 ${adminSecretError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      <ShieldCheck className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {adminSecretError && <p className="text-red-500 text-xs mt-1">{adminSecretError}</p>}
                  </div>
                )}

                <div className="pt-2 animate-fade-in stagger-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold shadow-btn-hover btn-hover"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Link"}
                    {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </div>
              </form>

              <p className="text-center text-text-secondary mt-8 animate-fade-in stagger-4">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-text-primary">Check Your Email</h2>
              <div className="space-y-2 text-text-secondary">
                <p>We&apos;ve sent a verification link to <span className="font-semibold text-text-primary">{email}</span></p>
                <p className="text-sm">Link expires in 1 hour</p>
                {signupMode === "admin" && (
                  <p className="text-sm text-amber-600 font-medium mt-2">
                    Your admin account will be auto-approved after registration.
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSuccess(false);
                  setInviteCode("");
                  setEmail("");
                  setAdminSecretCode("");
                }}
                className="text-primary"
              >
                Use a different email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
