"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, UtensilsCrossed, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send verification link");
      } else {
        toast.success("Verification link sent!");
        setIsSuccess(true);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex w-[40%] bg-primary flex-col p-12 relative overflow-hidden">
        {/* Animated bokeh bubbles */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary-light rounded-full mix-blend-screen filter blur-3xl animate-bokeh"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#2E7D52] rounded-full mix-blend-screen filter blur-3xl animate-bokeh stagger-3"></div>

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center gap-3 text-white mb-16">
            <UtensilsCrossed className="w-8 h-8 text-accent-gold" />
            <span className="font-heading text-xl font-bold tracking-wider">ONLINE HALL MEAL MANAGER</span>
          </div>

          <h2 className="font-heading text-4xl text-white font-bold mb-10">
            How it works
          </h2>
          
          <div className="space-y-8 mt-4">
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-1">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Verify Email</h3>
                <p className="text-white/70">Enter your email address to receive a secure verification link.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-2">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Complete Profile</h3>
                <p className="text-white/70">Click the link, enter your name and hall token number, and set a password.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-3">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Wait for Approval</h3>
                <p className="text-white/70">The hall administration will verify your details and activate your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Join the Hall</h1>
            <p className="text-text-secondary">Verify your email to get started.</p>
          </div>

          {isSuccess ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center animate-fade-in shadow-sm">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">Check your email</h3>
              <p className="text-text-secondary mb-6">
                We've sent a verification link to <span className="font-medium text-text-primary">{email}</span>. Please check your inbox and click the link to complete your registration.
              </p>
              <p className="text-sm text-text-disabled mb-6">Note: The link will expire in 1 hour.</p>
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => setIsSuccess(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendVerification} className="mt-6 space-y-5">
              <div className="space-y-2 animate-fade-in stagger-1">
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

              <div className="pt-4 animate-fade-in stagger-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold shadow-btn-hover btn-hover"
                  disabled={isLoading || !email}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Verification Link"}
                  {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-text-secondary mt-8 animate-fade-in stagger-3">
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
