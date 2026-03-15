"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Hash, Lock, UtensilsCrossed, ArrowRight, Loader2, Info, Eye, EyeOff, AlertCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

function CompleteRegistrationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [email, setEmail] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenNumber, setTokenNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerificationError("Invalid or missing verification token.");
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-token?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setVerificationError(data.message || "Failed to verify token.");
        } else {
          setEmail(data.email);
        }
      } catch {
        setVerificationError("An error occurred during verification.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
          tokenNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Account created! Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
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
            Complete Registration
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start opacity-60">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold shrink-0">1</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">Verify Email</h3>
                <p className="text-primary-muted font-body">Enter your invite code and email address.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-gold text-primary font-bold shrink-0">2</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">Complete Profile</h3>
                <p className="text-primary-muted font-body">Fill in your name, password and token number.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start opacity-60">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold shrink-0">3</div>
              <div>
                <h3 className="text-white font-semibold text-xl mb-1">Wait for Approval</h3>
                <p className="text-primary-muted font-body">Admin will review and activate your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form or Error/Loading */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-text-secondary text-lg">Verifying your link...</p>
            </div>
          ) : verificationError ? (
            <div className="flex flex-col items-center justify-center text-center space-y-6 border border-red-100 bg-red-50 p-8 rounded-xl">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h2 className="font-heading text-2xl font-bold text-red-700">Link Invalid or Expired</h2>
              <p className="text-red-600/80">{verificationError}</p>
              <Button onClick={() => router.push("/signup")} className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                Request a new link
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">Almost There!</h1>
                <p className="text-text-secondary">Complete your profile for <span className="font-semibold text-text-primary">{email}</span>.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 animate-fade-in stagger-1">
                  <label className="text-sm font-medium text-text-primary block">Full Name</label>
                  <div className="relative">
                    <Input
                      required
                      disabled={isSubmitting}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-12"
                    />
                    <User className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-2 animate-fade-in stagger-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-primary block">Token Number</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" tabIndex={-1}>
                          <Info className="w-4 h-4 text-text-disabled" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This is the unique ID number assigned to you by the hall administration.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <Input
                      required
                      disabled={isSubmitting}
                      value={tokenNumber}
                      onChange={(e) => setTokenNumber(e.target.value)}
                      type="text"
                      placeholder="e.g. 210403"
                      className="pl-10 h-12"
                    />
                    <Hash className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-fade-in stagger-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary block">Password</label>
                    <div className="relative">
                      <Input
                        required
                        disabled={isSubmitting}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12"
                      />
                      <Lock className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary block">Confirm</label>
                    <div className="relative">
                      <Input
                        required
                        disabled={isSubmitting}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12"
                      />
                      <Lock className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 animate-fade-in stagger-4">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold shadow-btn-hover btn-hover"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <CompleteRegistrationInner />
    </Suspense>
  );
}
