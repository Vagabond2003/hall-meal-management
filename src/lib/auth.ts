import { NextAuthOptions, getServerSession, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { createRateLimiter } from "@/lib/rate-limit";

/** Failed credential attempts per IP (10 per 15 minutes). Successful logins do not consume. */
const failedLoginLimiter = createRateLimiter(10, 15 * 60 * 1000);

async function getRequestIp(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}


export async function requireStudent() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const ip = await getRequestIp();
        const rateLimitFailedAttempt = () => {
          const result = failedLoginLimiter(ip);
          if (!result.success) {
            throw new Error("Too many requests. Please try again later.");
          }
        };

        // Fetch user from Supabase using the service role client
        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) {
          rateLimitFailedAttempt();
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          rateLimitFailedAttempt();
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved,
          is_active: user.is_active,
          token_number: user.token_number,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.is_approved = user.is_approved;
        token.is_active = user.is_active;
        token.token_number = user.token_number;
        token.meal_selection_enabled = user.meal_selection_enabled;
      }
      // Always re-fetch live values from DB on every token refresh
      if (token.id) {
        const { data } = await supabaseAdmin
          .from("users")
          .select("name, is_approved, is_active, role, meal_selection_enabled")
          .eq("id", token.id)
          .single();

        if (data) {
          token.name = data.name;
          token.is_approved = data.is_approved;
          token.is_active = data.is_active;
          token.role = data.role;
          token.meal_selection_enabled = data.meal_selection_enabled;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string; // Always use DB-fetched name, never default
        session.user.role = token.role as string;
        session.user.is_approved = token.is_approved as boolean;
        session.user.is_active = token.is_active as boolean;
        session.user.token_number = token.token_number as string | null;
        session.user.meal_selection_enabled = token.meal_selection_enabled as boolean | null | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in always go to root — root page will handle role-based redirect
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
