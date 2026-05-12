"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <Show when="signed-in">
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
                Offer services and earn money from clients looking for your
                skills
              </p>
              <Button size="lg" variant="secondary" asChild className="w-full">
                <Link href="/bounty/create">Create New Bounty</Link>
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
                <Link href="/bounty/browse">Browse Bounties</Link>
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
                  <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <Briefcase className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    In Progress
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Earnings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">$0</p>
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
                  No activity yet. Start by posting your first bounty or
                  browsing available opportunities!
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when="signed-out">
        {/* Landing Page for Non-Authenticated Users */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Buy and Sell{" "}
              <span className="bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Services
              </span>{" "}
              Instantly
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Connect with professionals worldwide. Post a bounty to get things
              done or offer your skills and earn.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                asChild
                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base px-8 h-12"
              >
                <Link href="/sign-up">
                  <Plus className="w-5 h-5 mr-2" />
                  Get Started
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base px-8 h-12"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Post Bounties
              </h3>
              <p className="text-gray-600">
                Need something done? Post a bounty and let skilled professionals
                compete to deliver.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Earn Money
              </h3>
              <p className="text-gray-600">
                Browse available bounties and offer your services to earn money
                on your own terms.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Easy
              </h3>
              <p className="text-gray-600">
                Safe transactions with escrow protection and transparent ratings
                for every user.
              </p>
            </div>
          </div>
        </section>
      </Show>
    </div>
  );
}
