import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6 animate-fade-up">
        <div className="mx-auto w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <h1 className="font-heading text-3xl font-bold">Account Pending</h1>
        <p className="text-text-secondary text-lg">
          Your student account has been created successfully, but it is currently awaiting approval from a Hall Administrator. 
        </p>
        <p className="text-text-secondary">
          You will be able to access the dashboard and manage your meals once your account is activated.
        </p>
        <div className="pt-6">
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
