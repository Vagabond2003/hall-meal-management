import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex w-full">
      <div className="hidden lg:flex w-[40%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-light rounded-full mix-blend-screen filter blur-3xl animate-bokeh" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#2E7D52] rounded-full mix-blend-screen filter blur-3xl animate-bokeh stagger-2" />
        <div className="relative z-10 flex items-center gap-3 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent-gold" aria-hidden="true"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>
          <span className="font-heading text-xl font-bold tracking-wider">ONLINE HALL MEAL MANAGER</span>
        </div>
        <div className="relative z-10">
          <h2 className="font-heading text-4xl text-white font-bold leading-tight mb-4">Almost There!</h2>
          <p className="text-primary-muted italic">"Your account is under review by the Hall Administrator."</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">Awaiting Approval</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold">Account Pending</h1>
          <p className="text-text-secondary text-lg">
            Your student account has been created successfully, but it is currently awaiting approval from a Hall Administrator.
          </p>
          <p className="text-text-secondary">
            You will be able to access the dashboard and manage your meals once your account is activated.
          </p>
          <div className="pt-4">
            <Link href="/login" className="w-full h-12 bg-primary hover:bg-primary-light text-white text-base font-semibold rounded-lg flex items-center justify-center transition-colors">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
