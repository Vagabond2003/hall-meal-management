"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  User, Mail, Hash, Lock, Ticket,
  UtensilsCrossed, ArrowRight, Loader2, Info, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenNumber, setTokenNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
          name,
          email,
          password,
          token_number: tokenNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      router.push("/pending-approval");
    } catch {
      toast.error("Something went wrong. Please try again.");
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

          <h2 className="font-heading text-4xl lg:text-5xl text-white font-bold leading-tight mb-6">
            Join the Hall
          </h2>
          <p className="text-primary-muted font-body text-lg leading-relaxed">
            An invite code is required to register. Please obtain your code from the hall administration.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Regular Meals</span>
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Special Feasts</span>
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Easy Billing</span>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Create Account</h1>
            <p className="text-text-secondary">Enter your invite code and details to get started.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2 animate-fade-in stagger-1">
              <label className="text-sm font-medium text-text-primary block">Invite Code</label>
              <div className="relative">
                <Input
                  required
                  disabled={isLoading}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  type="text"
                  placeholder="e.g. ABCD2345"
                  className="pl-10 h-12 font-mono uppercase tracking-widest"
                />
                <Ticket className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in stagger-2">
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

            <div className="space-y-2 animate-fade-in stagger-2">
              <label className="text-sm font-medium text-text-primary block">Email Address</label>
              <div className="relative">
                <Input
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="john@gmail.com"
                  className="pl-10 h-12"
                />
                <Mail className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in stagger-3">
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
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Student Account"}
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
    </div>
  );
}
