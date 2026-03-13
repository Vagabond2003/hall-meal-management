"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  User, Mail, Hash, Lock, Shield, 
  UtensilsCrossed, ArrowRight, Loader2, Info, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState("student");
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rnaNumber, setRnaNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === "student" && { rna_number: rnaNumber }),
        ...(role === "admin" && { admin_secret_code: adminCode })
      };

      const res = await fetch("/api/auth/register", {
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

      toast.success("Account created successfully!");
      
      if (role === "student") {
        router.push("/pending-approval");
      } else {
        router.push("/login?registered=true");
      }
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
            <span className="font-heading text-xl font-bold tracking-wider">HALL MEAL HUB</span>
          </div>

          <h2 className="font-heading text-4xl text-white font-bold mb-10">
            How it works
          </h2>
          
          <div className="space-y-8 mt-4">
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-1">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Create an Account</h3>
                <p className="text-white/70">Register with your real name and your hall-assigned RNA number.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-2">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Wait for Approval</h3>
                <p className="text-white/70">The hall administration will verify your details and activate your account.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start text-white/90 animate-fade-up stagger-3">
              <div className="w-8 h-8 rounded-full bg-accent-gold text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Manage Meals</h3>
                <p className="text-white/70">Toggle your daily meals on or off, and view your monthly bill easily.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col p-6 bg-background relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md mx-auto my-auto animate-fade-up py-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Join the Hall</h1>
            <p className="text-text-secondary">Create your account to get started.</p>
          </div>

          <Tabs defaultValue="student" className="w-full mb-8" onValueChange={setRole}>
            <TabsList className="grid w-full grid-cols-2 h-12 rounded-full p-1 bg-surface-secondary border border-border">
              <TabsTrigger value="student" className="rounded-full rounded-r-none transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Student</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-full rounded-l-none transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSignup} className="mt-6 space-y-5">
              <div className="space-y-2 animate-fade-in stagger-1">
                <label className="text-sm font-medium text-text-primary block">Full Name</label>
                <div className="relative">
                  <Input required disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="John Doe" className="pl-10 h-12" />
                  <User className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in stagger-2">
                <label className="text-sm font-medium text-text-primary block">Email Address (Gmail preferred)</label>
                <div className="relative">
                  <Input required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="john@gmail.com" className="pl-10 h-12" />
                  <Mail className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {role === "student" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-text-primary block">RNA Number</label>
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
                      <Input required={role === "student"} disabled={isLoading} value={rnaNumber} onChange={(e) => setRnaNumber(e.target.value)} type="text" placeholder="e.g. 210403" className="pl-10 h-12" />
                      <Hash className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </motion.div>
                )}

                {role === "admin" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-text-primary block">Secret Admin Code</label>
                    <div className="relative border border-border focus-within:border-primary rounded-md focus-within:ring-2 ring-primary/20 bg-background flex items-center pr-3">
                      <div className="pl-3 py-3 absolute left-0 flex items-center pointer-events-none">
                         <Shield className="w-5 h-5 text-text-disabled" />
                      </div>
                      <Input 
                        required={role === "admin"} 
                        disabled={isLoading} 
                        value={adminCode} 
                        onChange={(e) => setAdminCode(e.target.value)} 
                        type={showAdminCode ? "text" : "password"} 
                        placeholder="Enter the hall secret code" 
                        className="pl-10 h-12 border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none" 
                      />
                      <button 
                         type="button" 
                         className="text-xs font-semibold text-primary hover:underline ml-2"
                         onClick={() => setShowAdminCode(!showAdminCode)}
                      >
                         {showAdminCode ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   (role === "student" ? "Create Student Account" : "Create Admin Account")}
                  {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </div>
            </form>
          </Tabs>

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
