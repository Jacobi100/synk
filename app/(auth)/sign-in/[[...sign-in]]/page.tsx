import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen mx-auto py-10">
      <SignIn />
    </div>
  );
}
