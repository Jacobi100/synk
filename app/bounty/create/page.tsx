import { Navbar } from "@/components/Navbar";
import { BountyForm } from "@/components/BountyForm";

export default async function CreateBountyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a New Bounty
          </h1>
          <p className="text-gray-600">
            Share what you need done and get responses from professionals
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <BountyForm />
        </div>
      </div>
    </div>
  );
}
