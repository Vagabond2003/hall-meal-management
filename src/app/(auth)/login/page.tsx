"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, UtensilsCrossed, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
        setIsLoading(false);
      } else {
        toast.success("Login successful!");
        // We let middleware redirect based on role in reality, 
        // but we can push to a common point, or push home and let middleware redirect.
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
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
            <span className="font-heading text-xl font-bold tracking-wider">HALL MEAL HUB</span>
          </div>

          <h2 className="font-heading text-4xl lg:text-5xl text-white font-bold leading-tight mb-6">
            A Better Way to Manage Your Daily Meals
          </h2>
          <p className="text-primary-muted font-body text-lg italic">
            "Managing every meal, every day."
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Regular Meals</span>
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Special Feasts</span>
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Easy Billing</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl font-bold text-text-primary mb-3">Welcome Back</h1>
            <p className="text-text-secondary">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary block">Email Address</label>
              <div className="relative">
                <Input 
                  type="email" 
                  placeholder="name@example.com"
                  className="pl-10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Mail className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-primary block">Password</label>
                <Link href="/forgot-password" className="text-sm text-accent-gold hover:underline font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Lock className="w-5 h-5 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold shadow-btn-hover btn-hover mt-4"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-text-secondary mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
