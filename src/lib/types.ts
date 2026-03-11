import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      is_approved: boolean;
      is_active: boolean;
      rna_number?: string | null;
      meal_selection_enabled?: boolean | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    is_approved: boolean;
    is_active: boolean;
    rna_number?: string | null;
    meal_selection_enabled?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    is_approved: boolean;
    is_active: boolean;
    rna_number?: string | null;
    meal_selection_enabled?: boolean | null;
  }
}

