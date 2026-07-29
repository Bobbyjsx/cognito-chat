"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useSignup } from "@/hooks/data/useAuth/useAuth";
import { notifyServerError } from "@/lib/server-error";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function SignupForm() {
  const router = useRouter();
  const signupMutation = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: async () => {
          toast.success("Account created successfully!");
          const res = await signIn("credentials", {
            email: data.email,
            password: data.password,
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
          Create your account to get started.
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
                disabled={signupMutation.isPending}
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
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                disabled={signupMutation.isPending}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-label-md text-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                className="block text-label-md font-medium text-on-surface"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                disabled={signupMutation.isPending}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-label-md text-error" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.p
        variants={itemVariants}
        className="mt-8 text-center text-body-md text-gray-medium"
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-on-surface font-medium hover:underline underline-offset-4 transition-colors duration-200"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
