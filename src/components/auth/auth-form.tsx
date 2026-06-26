"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
        router.push("/student");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error(t("auth.authFailed"));

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        router.push(profile?.role === "instructor" ? "/instructor" : "/student");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error && locale === "en" ? error.message : t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <Link href="/" className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-white">{t("brand.name")}</p>
            <p className="text-sm text-slate-400">{t("brand.subtitle")}</p>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "signup" ? t("auth.joinTitle") : t("auth.welcomeBack")}</CardTitle>
            <CardDescription>{mode === "signup" ? t("auth.signupDesc") : t("auth.loginDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
                    {t("auth.fullName")}
                  </label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  {t("auth.email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  {t("auth.password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? t("auth.loading") : mode === "signup" ? t("auth.createStudent") : t("common.signIn")}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-400">
              {mode === "signup" ? t("auth.alreadyEnrolled") : t("auth.newStudent")}{" "}
              <Link
                href={mode === "signup" ? "/auth/login" : "/auth/signup"}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {mode === "signup" ? t("common.signIn") : t("auth.createAccount")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
