"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link2, ArrowLeft } from "lucide-react"

export default function StatsPage() {
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

      // Extract short code from URL if a full URL is pasted
      let shortCodeToLookup = url
      if (url.includes("/")) {
        const parts = url.split("/")
        const potentialCode = parts.pop() || ""
        if (potentialCode.length > 0 && !potentialCode.includes(".")) { // Basic check if it's a code
          shortCodeToLookup = potentialCode
        } else {
          // If it's still a URL like structure, try the one before last part if it's just domain/code
          if (parts.length > 0 && parts[parts.length-1].includes("smi.to")) { // a bit of a heuristic
            shortCodeToLookup = potentialCode // This would mean the last part was the code after all
          } else {
             // if it doesn't look like smi.to/code, we assume the user entered only the code.
          }
        }
      }
      
      // No API call here, just navigate to the dynamic route
      // The actual data fetching happens in app/stats/[shortCode]/page.tsx
      if (shortCodeToLookup) {
        router.push(`/stats/${shortCodeToLookup}`)
      } else {
        throw new Error("Could not extract a valid short code from the input.")
      }

    } catch (err: any) {
      setError(err.message || "Failed to process URL")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 font-sans">
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link2 className="h-5 w-5 text-cyan-400" />
            <span className="font-bold text-xl">smi.to</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="/#features" className="text-sm hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="text-sm hover:text-cyan-400 transition-colors">
              How It Works
            </a>
            <a href="/stats" className="text-sm hover:text-cyan-400 transition-colors">
              Statistics
            </a>
          </nav>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-4 md:p-24">
        <div className="w-full max-w-3xl space-y-8">
          <Button variant="outline" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">URL Statistics</h1>
            <p className="text-muted-foreground">Enter a shortened URL to view detailed statistics</p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>View URL Statistics</CardTitle>
              <CardDescription>Enter a shortened URL to see how many times it has been visited</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Enter shortened URL (e.g., https://smi.to/abc123)"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
                    {isLoading ? "Processing..." : "View Stats"}
                  </Button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Shortener
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
