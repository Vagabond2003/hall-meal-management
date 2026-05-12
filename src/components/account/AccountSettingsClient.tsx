"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { formatRoomDisplay } from "@/lib/utils";
import {
  User,
  Lock,
  ClipboardList,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

interface LoginHistoryItem {
  success: boolean;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Mobile Safari on iPhone/Android";
    if (ua.includes("Chrome")) return "Chrome on Android";
    if (ua.includes("Firefox")) return "Firefox on Mobile";
    return "Mobile Browser";
  }
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome on Desktop";
  if (ua.includes("Firefox")) return "Firefox on Desktop";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari on macOS";
  if (ua.includes("Edg")) return "Edge on Desktop";
  return "Unknown Browser";
}

function getPasswordStrength(password: string): { label: string; color: string; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "text-red-500", score };
  if (score === 2) return { label: "Fair", color: "text-amber-500", score };
  if (score === 3) return { label: "Good", color: "text-blue-500", score };
  return { label: "Strong", color: "text-green-600", score };
}

export default function AccountSettingsClient({ role }: { role: "admin" | "student" }) {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [originalRoom, setOriginalRoom] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ label: string; color: string; score: number } | null>(null);

  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
      setOriginalName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (role !== "student") return;
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.name === "string") {
          setName(data.name);
          setOriginalName(data.name);
        }
        const r = data.room_number ?? "";
        setRoomNumber(r);
        setOriginalRoom(r);
      } catch {
        // keep defaults
      }
    };
    loadProfile();
  }, [role]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetch("/api/account/login-history");
        if (!res.ok) throw new Error("Failed to fetch login history");
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err: any) {
        setHistoryError(err.message || "Could not load login history");
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name cannot be empty");

    const roomChanged =
      role === "student" && roomNumber.trim() !== (originalRoom || "").trim();
    const nameChanged = trimmed !== originalName;
    if (!nameChanged && !roomChanged) return;

    try {
      setSavingProfile(true);
      const body: { name: string; room_number?: string | null } = { name: trimmed };
      if (role === "student") {
        body.room_number = roomNumber.trim() === "" ? null : roomNumber.trim();
      }
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setName(data.name);
      setOriginalName(data.name);
      if (role === "student" && data.room_number !== undefined) {
        const r = data.room_number ?? "";
        setRoomNumber(r);
        setOriginalRoom(r);
      }
      if (update) {
        await update({ name: data.name });
      } else {
        router.refresh();
      }
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("All fields are required");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (newPassword === currentPassword) {
      return toast.error("New password must be different from current password");
    }

    try {
      setSavingPassword(true);
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength(null);
      toast.success("Password updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      setPasswordStrength(getPasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  };

  const lastLogin = history.find((h) => h.success)?.created_at;
  const lastLoginFormatted = lastLogin
    ? format(new Date(lastLogin), "EEE, MMM d, yyyy 'at' h:mm a")
    : "Not available";

  const canSaveProfile =
    name.trim().length > 0 &&
    (name.trim() !== originalName ||
      (role === "student" && roomNumber.trim() !== (originalRoom || "").trim()));

  const strengthColorMap: Record<number, string> = {
    0: "bg-slate-200",
    1: "bg-red-500",
    2: "bg-amber-500",
    3: "bg-blue-500",
    4: "bg-green-600",
  };

  return (
    <div className="space-y-8 pb-8 max-w-5xl mx-auto">
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <h1 className="text-3xl font-heading font-semibold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your profile, password and account activity.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your display name and view your account details.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col flex-grow space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  role === "admin"
                    ? "bg-[#1A3A2A] text-white"
                    : "bg-blue-900 text-white"
                }`}
              >
                {role === "admin" ? "ADMIN" : "STUDENT"}
              </span>
            </div>

            {role === "student" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Room number
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  maxLength={20}
                  placeholder="Not assigned"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 text-slate-900"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Displayed as {formatRoomDisplay(roomNumber)} if left empty. Use
                  letters, numbers, spaces, and hyphens (1–20 characters).
                </p>
              </div>
            )}

            {role === "student" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student ID / Token Number</label>
                <input
                  type="text"
                  value={(session?.user as any)?.token_number || ""}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1.5">Contact admin to update your token number.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Login</label>
              <p className="text-sm text-slate-600">{lastLoginFormatted}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!canSaveProfile || savingProfile}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white transition-all hover:bg-primary-light disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>

        {/* Password Card */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-500 mt-0.5">Use a strong password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col flex-grow space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[2.1rem] text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[2.1rem] text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= passwordStrength.score ? strengthColorMap[passwordStrength.score] : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[2.1rem] text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {confirmPassword.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1 text-xs">
                  {newPassword === confirmPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600 font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-red-500 font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary py-2 px-6 text-sm font-medium text-white transition-all hover:bg-primary-light disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Password
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Login History Card */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3, ease: "easeOut" as const }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Login History</h2>
            <p className="text-sm text-slate-500 mt-0.5">Recent sign-in activity on your account.</p>
          </div>
        </div>

        {loadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : historyError ? (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl">{historyError}</div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-10 h-10" />}
            title="No login history found"
            description="Your recent login activity will appear here."
          />
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50"
              >
                <div className="flex items-start gap-3">
                  {item.success ? (
                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {item.success ? "Successful login" : "Failed attempt"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{parseUserAgent(item.user_agent)}</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <p className="text-xs text-slate-400 font-mono">{item.ip || "Unknown IP"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
