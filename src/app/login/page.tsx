import { LoginForm } from "@/components/modules/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 p-4">
      <LoginForm />
    </div>
  );
}
