"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

const OnboardingPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const phone_number = (form.elements.namedItem("phone_number") as HTMLInputElement).value;
    const date_of_birth = (form.elements.namedItem("date_of_birth") as HTMLInputElement).value;

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone_number, date_of_birth }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setError(error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  if (!isLoaded) return null;

  return (
    <div>
      <h2>Complete your profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="username" type="text" placeholder="Username" required />
        <input name="phone_number" type="text" placeholder="Phone number" required />
        <input name="date_of_birth" type="date" required />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
};

export default OnboardingPage;