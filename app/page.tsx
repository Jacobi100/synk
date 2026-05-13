"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Bounty } from "@/lib/types/bounty";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  activeBounties: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
}

export default function Home() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    activeBounties: 0,
    inProgress: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch bounties
        const response = await fetch("/api/bounties?limit=1000");
        const bounties = (await response.json()) as Bounty[];

        // Calculate stats
        const active = bounties.filter((b) => b.status === "open").length;
        const inProg = bounties.filter(
          (b) => b.status === "in_progress",
        ).length;
        const done = bounties.filter(
          (b) => b.status === "completed",
        ).length;
        const earnings = bounties
          .filter((b) => b.status === "completed")
          .reduce(
            (sum: number, b: Bounty) => sum + (b.price_max || b.price_min || 0),
            0,
          );

        setStats({
          activeBounties: active,
          inProgress: inProg,
          completed: done,
          totalEarnings: earnings,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back to Synk
          </h1>
          <p className="text-gray-600">
            Manage your bounties and find new opportunities
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition">
            <Plus className="w-12 h-12 mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Post a Bounty</h2>
            <p className="mb-6 text-blue-100">
              Offer services and earn money from clients looking for your skills
            </p>
            <Button size="lg" variant="secondary" asChild className="w-full">
              <Link href="/bounties/create">Create New Bounty</Link>
            </Button>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow hover:shadow-lg transition">
            <Search className="w-12 h-12 mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              Browse Bounties
            </h2>
            <p className="mb-6 text-gray-600">
              Find and apply for bounties posted by other users to earn money
            </p>
            <Button size="lg" variant="default" asChild className="w-full">
              <Link href="/dashboard">Browse Bounties</Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Bounties
                </p>
                {loading ? (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.activeBounties}
                  </p>
                )}
              </div>
              <Briefcase className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                {loading ? (
                  <Loader2 className="w-6 h-6 text-orange-600 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.inProgress}
                  </p>
                )}
              </div>
              <Clock className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                {loading ? (
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.completed}
                  </p>
                )}
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Earnings</p>
                {loading ? (
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₦{stats.totalEarnings.toLocaleString()}
                  </p>
                )}
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No activity yet. Start by posting your first bounty or browsing
                available opportunities!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}