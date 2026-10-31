"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  LockKeyhole,
  LogOut,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

type ActiveForm = "profile" | "password" | null;

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          router.replace("/login?redirect=%2Fsettings");
          return;
        }

        if (active) {
          setUser(data.user);
          setName(data.user.name);
        }
      } catch {
        if (active) {
          setError("Unable to load account details. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  function toggleForm(form: ActiveForm) {
    setActiveForm((current) => (current === form ? null : form));
    setError("");
    setSuccess("");
  }

  function cancelForm() {
    setActiveForm(null);
    setError("");
    setSuccess("");
    setName(user?.name ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (name.trim().length < 2 || name.trim().length > 80) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to update profile name.");
        return;
      }

      setUser((current) =>
        current ? { ...current, name: data.user?.name ?? name.trim() } : current
      );
      setSuccess("Profile name updated successfully.");
      setActiveForm(null);
    } catch {
      setError("Network error. Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("New password must be between 8 and 72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to change password.");
        return;
      }

      setSuccess("Password updated successfully.");
      setActiveForm(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
    } catch {
      setError("Network error. Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setError("Unable to logout. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 transition-colors dark:bg-slate-950">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-blue-600" />
        <span className="text-slate-600 dark:text-slate-400">Loading settings...</span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      </main>
    );
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 transition-colors sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-800 px-6 py-8 text-white sm:px-8 dark:from-slate-950 dark:to-blue-950">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="mt-2 text-sm text-blue-100">
              Manage your RailConnect account and security
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="mb-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
              <p className="text-sm text-blue-800 dark:text-blue-300">Signed in as</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
            </div>

            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Account Management
            </h2>

            <button
              type="button"
              onClick={() => toggleForm("profile")}
              aria-expanded={activeForm === "profile"}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <UserRound className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">
                  Edit Personal Information
                </span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                  Update your account name
                </span>
              </span>
              {activeForm === "profile" ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {activeForm === "profile" && (
              <form
                onSubmit={handleProfileSave}
                className="mt-3 rounded-xl border border-blue-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Edit Personal Information
                </h3>

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                  <input
                    className={inputClass}
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                  <input
                    className={`${inputClass} cursor-not-allowed bg-slate-100 dark:bg-slate-900`}
                    type="email"
                    value={user.email}
                    readOnly
                    aria-readonly="true"
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Email modification is not permitted.
                  </span>
                </label>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelForm}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <button
              type="button"
              onClick={() => toggleForm("password")}
              aria-expanded={activeForm === "password"}
              className="mt-3 flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">
                  Change Password
                </span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                  Keep your account secure
                </span>
              </span>
              {activeForm === "password" ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {activeForm === "password" && (
              <form
                onSubmit={handlePasswordChange}
                className="mt-3 rounded-xl border border-blue-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter your current password and choose a new one.
                </p>

                {[
                  {
                    label: "Current Password",
                    value: currentPassword,
                    setter: setCurrentPassword,
                    autoComplete: "current-password",
                  },
                  {
                    label: "New Password",
                    value: newPassword,
                    setter: setNewPassword,
                    autoComplete: "new-password",
                  },
                  {
                    label: "Confirm New Password",
                    value: confirmPassword,
                    setter: setConfirmPassword,
                    autoComplete: "new-password",
                  },
                ].map((field) => (
                  <label
                    key={field.label}
                    className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {field.label}
                    <span className="relative block">
                      <input
                        className={`${inputClass} pr-12`}
                        type={showPasswords ? "text" : "password"}
                        value={field.value}
                        onChange={(event) => field.setter(event.target.value)}
                        autoComplete={field.autoComplete}
                        required
                        minLength={field.label === "Current Password" ? 1 : 8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((value) => !value)}
                        aria-label={
                          showPasswords ? "Hide passwords" : "Show passwords"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        {showPasswords ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </span>
                  </label>
                ))}

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  New password must contain at least 8 characters.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                    {saving ? "Updating..." : "Update Password"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelForm}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </p>
            )}

            {success && (
              <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                {success}
              </p>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                {loggingOut ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
