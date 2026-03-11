import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserX } from "lucide-react";

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6 animate-fade-up">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <UserX className="w-8 h-8 text-danger" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-danger">Account Deactivated</h1>
        <p className="text-text-secondary text-lg">
          Your account has been deactivated by the Hall Administrator. This may be due to leaving the hall or other administrative reasons.
        </p>
        <p className="text-text-secondary">
          If you believe this is an error, please contact the administration office directly.
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
