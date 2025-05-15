"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, BarChart2, Clock, Globe, Shield } from "lucide-react"

export default function HomePage() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!url) {
        throw new Error("Please enter a URL")
      }

      // Basic URL validation (can be more sophisticated)
      try {
        new URL(url)
      } catch (_) {
        throw new Error("Please enter a valid URL")
      }

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl: url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to process request" }))
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      const result = await response.json()

      if (result && result.shortCode) {
        // Navigate to the detailed stats page
        router.push(`/stats/${result.shortCode}`)
      } else {
        throw new Error("Failed to get short code from response.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to process URL")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navigation */}
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link2 className="h-5 w-5 text-cyan-400" />
            <span className="font-bold text-xl">smi.to</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm hover:text-cyan-400 transition-colors">
              How It Works
            </a>
            <a href="/stats" className="text-sm hover:text-cyan-400 transition-colors">
              Statistics
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section with URL Shortener */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simplify Your <span className="text-cyan-400">Links</span> Instantly
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto mb-10">
            Create short, memorable links with smi.to. Track clicks and analyze your link performance with our powerful
            analytics.
          </p>

          {/* URL Shortener Form */}
          <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter your long URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9 bg-slate-700 border-slate-600 text-white h-12"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="h-12 bg-cyan-500 hover:bg-cyan-600 text-white px-6">
                {isLoading ? "Shortening..." : "Shorten URL"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="bg-cyan-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-slate-600">
                Track clicks, geographic locations, and visitor patterns with comprehensive analytics.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="bg-cyan-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Shortening</h3>
              <p className="text-slate-600">Create short links in seconds with our lightning-fast processing system.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="bg-cyan-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Reliability</h3>
              <p className="text-slate-600">
                Our infrastructure ensures your links work reliably anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="h-48 bg-slate-100 rounded flex items-center justify-center">
                  <div className="text-6xl font-bold text-slate-200">1</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste Your URL</h3>
              <p className="text-slate-600">Enter your long URL in the shortener field at the top of the page.</p>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="h-48 bg-slate-100 rounded flex items-center justify-center">
                  <div className="text-6xl font-bold text-slate-200">2</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Your Short Link</h3>
              <p className="text-slate-600">Instantly receive your shortened smi.to link ready to share.</p>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="h-48 bg-slate-100 rounded flex items-center justify-center">
                  <div className="text-6xl font-bold text-slate-200">3</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-slate-600">View detailed statistics about your link's performance over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Link Management</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything you need for effective link shortening and tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-4">Real-time Analytics</h3>
              <p className="text-slate-600 mb-6">
                Track clicks, geographic locations, devices, and referrers in real-time to optimize your marketing
                campaigns.
              </p>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <BarChart2 className="h-16 w-16 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-semibold mb-4">Enhanced Security</h3>
              <p className="text-slate-600 mb-6">
                Our system ensures your links are secure and protected against malicious activity.
              </p>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="h-64 bg-slate-100 rounded flex items-center justify-center">
                  <Shield className="h-16 w-16 text-slate-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your links?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Start shortening URLs now and track their performance with our powerful analytics.
          </p>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg">Get Started</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Link2 className="h-5 w-5 text-cyan-500" />
              <span className="font-bold text-xl">smi.to</span>
            </div>
            <div className="flex space-x-8">
              <a href="#features" className="text-slate-600 hover:text-cyan-500">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-cyan-500">
                How It Works
              </a>
              <a href="/stats" className="text-slate-600 hover:text-cyan-500">
                Statistics
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
            <p>© 2025 smi.to. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
