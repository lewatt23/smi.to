"use client"

import { useEffect, useState } from "react"
import { getRecentUrls } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Check, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

type UrlItem = {
  _id: string
  originalUrl: string
  shortUrl: string
  shortCode: string
  createdAt: string
  visits: number
}

export function UrlList() {
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchUrls() {
      try {
        const recentUrls = await getRecentUrls()
        setUrls(recentUrls)
      } catch (error) {
        console.error("Failed to fetch URLs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUrls()
  }, [])

  const copyToClipboard = (url: string, index: number) => {
    navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (loading) {
    return <div className="py-4 text-center">Loading recent URLs...</div>
  }

  if (urls.length === 0) {
    return <div className="py-4 text-center">No URLs have been shortened yet</div>
  }

  return (
    <div className="space-y-4">
      {urls.map((url, index) => (
        <div key={index} className="p-4 border rounded-lg">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <a
                href={url.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline flex items-center"
              >
                {url.shortUrl} <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              <div className="flex items-center gap-2">
                <Link href={`/stats/${url.shortCode}`} passHref>
                  <Button variant="ghost" size="sm" className="h-8">
                    Stats
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(url.shortUrl, index)} className="h-8">
                  {copiedIndex === index ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedIndex === index ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate">Original: {url.originalUrl}</p>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">Created: {new Date(url.createdAt).toLocaleString()}</p>
              <p className="text-xs font-medium">
                {url.visits} {url.visits === 1 ? "visit" : "visits"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
