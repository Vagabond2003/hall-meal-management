"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  User, Lock, Hash, UtensilsCrossed, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, Info, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

function CompleteRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenNumber, setTokenNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setErrorMessage("No verification token provided.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-token?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setIsValid(true);
          setEmail(data.email);
        } else {
          setErrorMessage(data.message || "This verification link is invalid or has expired.");
        }
      } catch {
        setErrorMessage("Failed to verify token. Please try again.");
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

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
          token_number: tokenNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success("Account created successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md text-center animate-fade-up">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Verifying your link...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired token
  if (!isValid && !isVerifying) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-3">
            Link Invalid or Expired
          </h2>
          <p className="text-text-secondary mb-6">{errorMessage}</p>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary-light text-white font-semibold px-8 h-12">
              Request New Link
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-3">
            Account Created!
          </h2>
          <p className="text-text-secondary">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
      <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Complete Your Profile</h1>
          <p className="text-text-secondary">
            Creating account for <strong className="text-text-primary">{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 animate-fade-in stagger-1">
            <label className="text-sm font-medium text-text-primary block">Full Name</label>
            <div className="relative">
              <Input
                required
                disabled={isLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="John Doe"
                className="pl-10 h-12"
              />
              <User className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-in stagger-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary block">Password</label>
              <div className="relative">
                <Input
                  required
                  disabled={isLoading}
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
                  disabled={isLoading}
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

          <div className="space-y-2 animate-fade-in stagger-3">
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
                disabled={isLoading}
                value={tokenNumber}
                onChange={(e) => setTokenNumber(e.target.value)}
                type="text"
                placeholder="e.g. 210403"
                className="pl-10 h-12"
              />
              <Hash className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-4 animate-fade-in stagger-4">
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold shadow-btn-hover btn-hover"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        </form>

        <p className="text-center text-text-secondary mt-8 animate-fade-in stagger-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CompleteRegistrationPage() {
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

          <h2 className="font-heading text-4xl lg:text-5xl text-white font-bold leading-tight mb-6">
            Almost There!
          </h2>
          <p className="text-primary-muted font-body text-lg italic">
            &quot;Complete your profile to start managing your meals.&quot;
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">✓ Email Verified</span>
          <span className="bg-accent-gold/20 text-accent-gold px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-accent-gold/30">→ Complete Profile</span>
        </div>
      </div>

      {/* Right Panel - wrapped in Suspense */}
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        }
      >
        <CompleteRegistrationForm />
      </Suspense>
    </div>
  );
}
