"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useResetPassword } from "@/hooks/data/useAuth/useAuth";
import { notifyServerError } from "@/lib/server-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

export function ForgotPasswordForm() {
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      newPassword: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    resetPasswordMutation.mutate(
      { email: data.email, newPassword: data.newPassword },
      {
        onSuccess: (response) => {
          toast.success(response?.message || "Password updated successfully!");
          reset();
        },
        onError: (err) => {
          notifyServerError(err, "Failed to reset password");
        },
      },
    );
  };

  return (
    <motion.div
      className="w-full max-w-[400px]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={itemVariants}
        className="mb-10 flex flex-col items-center text-center"
      >
        <Logo className="justify-center mb-3" />
        <p className="text-gray-medium text-body-md leading-relaxed">
          Enter your email and a new password.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white p-8 md:p-10 ambient-shadow">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <label
                className="block text-label-md font-medium text-on-surface"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={resetPasswordMutation.isPending}
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-label-md text-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                className="block text-label-md font-medium text-on-surface"
                htmlFor="newPassword"
              >
                New password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter a new password"
                disabled={resetPasswordMutation.isPending}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-label-md text-error" role="alert">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-body-md text-gray-medium hover:text-on-surface transition-colors duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </motion.div>
    </motion.div>
  );
}
