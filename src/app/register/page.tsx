import { SignupForm } from "@/components/modules/auth/SignupForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-surface-container-low px-4 py-12">
      <SignupForm />
    </div>
  );
}
