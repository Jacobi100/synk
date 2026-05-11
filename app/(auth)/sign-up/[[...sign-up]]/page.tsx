import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen mx-auto py-10">
      <SignUp />
    </div>
  );
}