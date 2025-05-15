"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"
import { ArrowLeft, Copy, Check, ExternalLink, Link2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface VisitDetail {
  timestamp: string // Date string
  userAgent?: string
  referrer?: string
}

interface ShortLinkStats {
  _id?: string // Assuming ObjectId is stringified
  originalUrl: string
  shortCode: string
  shortUrl?: string // This might be constructed or part of the data
  createdAt: string // Date string
  visits: number
  lastVisitedAt?: string // Optional Date string
  visitHistory?: VisitDetail[]
}

export default function StatsPage() {
  const params = useParams()
  const router = useRouter()
  const shortCode = params?.shortCode as string | undefined
  const [stats, setStats] = useState<ShortLinkStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (shortCode) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/stats/${shortCode}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Failed to parse error response" }))
            throw new Error(errorData.error || `Error: ${res.status}`)
          }
          return res.json()
        })
        .then((data: ShortLinkStats) => {
          // Construct shortUrl if not present in API response
          const host = window.location.host
          const protocol = window.location.protocol
          const fullShortUrl = `${protocol}//${host}/${data.shortCode}`
          setStats({ ...data, shortUrl: fullShortUrl })
          setIsLoading(false)
        })
        .catch((err) => {
          console.error("Failed to fetch stats:", err)
          setError(err.message || "Could not load statistics.")
          setIsLoading(false)
        })
    } else {
      setError("Short code not found in URL.")
      setIsLoading(false)
    }
  }, [shortCode])

  const copyToClipboard = () => {
    if (stats && stats.shortUrl) {
      navigator.clipboard.writeText(stats.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Prepare data for visit history chart
  const prepareVisitHistoryData = () => {
    if (!stats || !stats.visitHistory || !stats.visitHistory.length) return []
    const visitsByDay = stats.visitHistory.reduce((acc: Record<string, number>, visit) => {
      const date = new Date(visit.timestamp).toLocaleDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})
    return Object.entries(visitsByDay)
      .map(([date, visits]) => ({ date, visits }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Prepare data for hourly distribution chart
  const prepareHourlyData = () => {
    if (!stats || !stats.visitHistory || !stats.visitHistory.length) return []
    const hours = Array(24)
      .fill(null)
      .map((_, i) => ({ hour: i.toString().padStart(2, "0") + ":00", visits: 0 }))
    stats.visitHistory.forEach((visit) => {
      const hour = new Date(visit.timestamp).getHours()
      hours[hour].visits += 1
    })
    return hours
  }

  const visitHistoryData = prepareVisitHistoryData()
  const hourlyData = prepareHourlyData()

  if (isLoading) {
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
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
          <div className="text-center">Loading statistics...</div>
        </main>
      </div>
    )
  }

  if (error) {
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
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Could not load URL statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">{error}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/")} className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    )
  }

  if (!stats) {
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
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <CardTitle>URL Not Found</CardTitle>
              <CardDescription>The requested URL could not be found or has no stats.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/")} className="bg-cyan-500 hover:bg-cyan-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    )
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
      <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
        <div className="w-full max-w-4xl space-y-8">
          <Button variant="outline" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>URL Statistics</CardTitle>
              <CardDescription>Detailed statistics for your shortened URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">URL Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Short URL:</span>
                    <div className="flex items-center">
                      <a
                        href={stats.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:underline mr-2"
                      >
                        {stats.shortUrl}
                        <ExternalLink className="inline-block ml-1 h-3 w-3" />
                      </a>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Original URL:</span>
                    <a
                      href={stats.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline truncate max-w-[200px] md:max-w-[300px]"
                    >
                      {stats.originalUrl}
                      <ExternalLink className="inline-block ml-1 h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{new Date(stats.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Visits:</span>
                    <span className="text-lg font-bold">{stats.visits}</span>
                  </div>
                  {stats.lastVisitedAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Last Visited:</span>
                      <span>{new Date(stats.lastVisitedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Visit History (by day)</h3>
                {visitHistoryData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visitHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="visits" stroke="#06b6d4" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-4 text-red-500">No visit history available yet</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hourly Distribution (all time)</h3>
                {stats.visits > 0 && hourlyData.some((h) => h.visits > 0) ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData}>
                        <XAxis
                          dataKey="hour"
                          label={{ value: "Hour of Day (24h)", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis allowDecimals={false} label={{ value: "Visits", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Bar dataKey="visits" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-4 text-red-500">No visit data available yet for hourly distribution</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recent Individual Visits</h3>
                {stats.visitHistory && stats.visitHistory.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                    {stats.visitHistory
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map((visit, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                          <p className="text-sm">
                            <span className="font-medium">Time:</span> {new Date(visit.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-red-500">No individual visits recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
