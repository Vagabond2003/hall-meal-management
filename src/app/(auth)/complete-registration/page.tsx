"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Hash, Lock, UtensilsCrossed, ArrowRight, Loader2, Info, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenError, setTokenError] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [rnaNumber, setRnaNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No verification token found.");
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-token?token=${token}`);
        const data = await res.json();
        
        if (data.valid) {
          setIsValidToken(true);
        } else {
          setTokenError(data.message || "Invalid or expired token.");
        }
      } catch (error) {
        setTokenError("Failed to verify token. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        token,
        name,
        password,
        token_number: rnaNumber
      };

      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      toast.success("Account created! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    } catch {
      toast.error("An unexpected error occurred");
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
            Almost there!
          </h2>
          
          <div className="space-y-8 mt-4">
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-1">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">✓</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Email Verified</h3>
                <p className="text-white/70">Your email has been successfully verified.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-2">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Complete Profile</h3>
                <p className="text-white/70">Enter your name, token number, and secure password.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          
          {isVerifying ? (
            <div className="text-center py-20 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold text-text-primary">Verifying your link...</h2>
              <p className="text-text-secondary mt-2">Please wait while we check your verification token.</p>
            </div>
          ) : !isValidToken ? (
            <div className="bg-surface border border-destructive/20 rounded-xl p-8 text-center animate-fade-in shadow-sm">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-2">Invalid Link</h3>
              <p className="text-text-secondary mb-6">{tokenError}</p>
              <Link href="/register" className="w-full block">
                <Button className="w-full h-12 bg-primary">Request a new link</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Complete Profile</h1>
                <p className="text-text-secondary">Finish setting up your account.</p>
              </div>

              <form onSubmit={handleCompleteRegistration} className="mt-6 space-y-5">
                <div className="space-y-2 animate-fade-in stagger-1">
                  <label className="text-sm font-medium text-text-primary block">Full Name</label>
                  <div className="relative">
                    <Input required disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="John Doe" className="pl-10 h-12" />
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
                    <Input required disabled={isLoading} value={rnaNumber} onChange={(e) => setRnaNumber(e.target.value)} type="text" placeholder="e.g. 210403" className="pl-10 h-12" />
                    <Hash className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-fade-in stagger-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary block">Password</label>
                    <div className="relative">
                      <Input required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-12" />
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
                      <Input required disabled={isLoading} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 h-12" />
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
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
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
