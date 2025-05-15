"use client"

import { useEffect, useState } from "react"
import { getUrlStats } from "@/app/actions"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type UrlStat = {
  _id: string
  originalUrl: string
  shortUrl: string
  shortCode: string
  createdAt: string
  visits: number
}

export function UrlStats() {
  const [stats, setStats] = useState<UrlStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const urlStats = await getUrlStats()
        setStats(urlStats)
      } catch (error) {
        console.error("Failed to fetch URL stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="py-4 text-center">Loading statistics...</div>
  }

  if (stats.length === 0) {
    return <div className="py-4 text-center">No statistics available yet</div>
  }

  // Prepare data for chart
  const chartData = stats.map((stat) => ({
    name: stat.shortCode,
    visits: stat.visits,
    url: stat.shortUrl,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-md p-2 shadow-sm">
                          <p className="text-sm font-medium">{payload[0].payload.url}</p>
                          <p className="text-sm">Visits: {payload[0].value}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">URL Visit Details</h3>
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="truncate max-w-[70%]">
                <p className="font-medium text-sm">{stat.shortUrl}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.originalUrl}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {stat.visits} {stat.visits === 1 ? "visit" : "visits"}
                </div>
                <Link href={`/stats/${stat.shortCode}`} passHref>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
