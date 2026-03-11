import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    is_approved: boolean;
    is_active: boolean;
    rna_number?: string | null;
    meal_selection_enabled?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      is_approved: boolean;
      is_active: boolean;
      rna_number?: string | null;
      meal_selection_enabled?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    is_approved: boolean;
    is_active: boolean;
    rna_number?: string | null;
    meal_selection_enabled?: boolean;
  }
}
