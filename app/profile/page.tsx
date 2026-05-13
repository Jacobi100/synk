"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (res.ok) {
        const p = await res.json();
        setUsername(p.username || "");
        setFullName(p.full_name || "");
        setPhone(p.phone_number || "");
        setAccountNumber(p.account_number || "");
        setBankCode(p.bank_code || "");
      }
      setLoading(false);
    })();
  }, [isLoaded, user]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        full_name: fullName,
        phone_number: phone,
        account_number: accountNumber,
        bank_code: bankCode,
      }),
    });
    setSaving(false);
    if (!res.ok) setMessage("Could not save profile");
    else setMessage("Saved");
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="px-4 py-12 text-center text-gray-600">Sign in to manage your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to feed
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Profile & payout</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a Nigerian bank account (10 digits + bank code) so Squad Transfer can pay you when a poster completes a
          bounty.
        </p>
        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone (080…)</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">Payout account</h2>
              <p className="text-xs text-gray-500">Used with Squad Transfer when you are the provider.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bank code</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g. 058"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Account number</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="10 digits"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            {message && <p className="text-sm text-gray-600">{message}</p>}
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
