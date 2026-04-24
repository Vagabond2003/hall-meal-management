import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      is_approved: boolean;
      is_active: boolean;
      token_number?: string | null;  // was rna_number
      meal_selection_enabled?: boolean | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    is_approved: boolean;
    is_active: boolean;
    token_number?: string | null;  // was rna_number
    meal_selection_enabled?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    is_approved?: boolean;
    is_active?: boolean;
    token_number?: string | null;  // was rna_number
    meal_selection_enabled?: boolean | null;
  }
}
