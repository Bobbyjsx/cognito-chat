"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useResetPassword } from "@/hooks/data/useAuth/useAuth";
import { notifyServerError } from "@/lib/server-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Bot, Loader2, Lock, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const resetPasswordMutation = useResetPassword();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    resetPasswordMutation.mutate(
      { email, newPassword },
      {
        onSuccess: (data) => {
          toast.success(data?.message || "Password updated successfully!");
          setEmail("");
          setNewPassword("");
        },
        onError: (err) => {
          notifyServerError(err, "Failed to reset password");
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-2xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          Reset Password
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Enter your registered email and new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={resetPasswordMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10"
                disabled={resetPasswordMutation.isPending}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-800/60 pt-4">
        <p className="text-sm text-slate-400">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
          >
            Back to login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
