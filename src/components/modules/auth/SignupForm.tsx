"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useSignup } from "@/hooks/data/useAuth/useAuth";
import { notifyServerError } from "@/lib/server-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Bot, Loader2, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";

export function SignupForm() {
  const router = useRouter();
  const signupMutation = useSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    signupMutation.mutate(
      { email, password },
      {
        onSuccess: async () => {
          toast.success("Account created successfully!");
          // Automatically log the user in
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (res?.error) {
            router.push("/login");
          } else {
            router.push("/");
            router.refresh();
          }
        },
        onError: (err) => {
          notifyServerError(err, "Failed to create account");
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
          Create Account
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Get started with Cognito-Chat AI assistant
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
                disabled={signupMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={signupMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={signupMutation.isPending}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-800/60 pt-4">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
