import { BackgroundBeams } from "@/app/components/BackgroundBeams";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
        <BackgroundBeams className="opacity-20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-50">
            <div className="fixed top-0 -left-32 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-2000"></div>
            <div className="fixed bottom-0 -right-32 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob"></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-4000"></div>
          </div>
        </div>
      <div className="max-w-md w-full p-8 rounded-lg bg-background/80 backdrop-blur-sm border border-foreground/10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gradient bg-gradient-to-r from-violet-500 to-fuchsia-500">
            Check Your Email
          </h1>
          <p className="text-foreground/80 mb-6">
            We've sent you a verification link to your email address. Please
            click the link to verify your account.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Didn't receive the email? Check your spam folder or try signing in
              again.
            </p>
            <Link
              href="/signin"
              className="inline-block px-6 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
