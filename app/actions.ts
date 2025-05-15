"use server"

import { Redis } from "@upstash/redis"
import { nanoid } from "nanoid"
import { revalidatePath } from "next/cache"

// Initialize Redis client
const redis = Redis.fromEnv()

// Base URL for shortened URLs
const BASE_URL = "https://smi.to/"

// Function to generate a unique short code
const generateShortCode = () => {
  return nanoid(6) // Generate a 6-character unique ID
}

// Function to shorten a URL
export async function shortenUrl(originalUrl: string) {
  try {
    // Validate URL
    try {
      new URL(originalUrl)
    } catch (e) {
      return { error: "Invalid URL format" }
    }

    // Generate a unique short code
    const shortCode = generateShortCode()

    // Store the URL mapping in Redis
    await redis.set(`url:${shortCode}`, originalUrl)

    // Initialize visit count
    await redis.set(`stats:${shortCode}`, 0)

    // Store in recent URLs list (limit to 10)
    const urlData = {
      originalUrl,
      shortCode,
      shortUrl: `${BASE_URL}${shortCode}`,
      createdAt: new Date().toISOString(),
    }

    await redis.lpush("recent_urls", JSON.stringify(urlData))
    await redis.ltrim("recent_urls", 0, 9)

    revalidatePath("/")

    return {
      shortUrl: `${BASE_URL}${shortCode}`,
      shortCode,
    }
  } catch (error) {
    console.error("Error shortening URL:", error)
    return { error: "Failed to shorten URL" }
  }
}

// Function to get the original URL from a short code
export async function getOriginalUrl(shortCode: string) {
  try {
    const originalUrl = await redis.get<string>(`url:${shortCode}`)

    if (!originalUrl) {
      return { error: "URL not found" }
    }

    // Increment visit count
    await redis.incr(`stats:${shortCode}`)

    return { originalUrl }
  } catch (error) {
    console.error("Error retrieving URL:", error)
    return { error: "Failed to retrieve URL" }
  }
}

// Function to get recent URLs
export async function getRecentUrls() {
  try {
    const recentUrls = await redis.lrange("recent_urls", 0, 9)
    return recentUrls.map((url) => JSON.parse(url))
  } catch (error) {
    console.error("Error retrieving recent URLs:", error)
    return []
  }
}

// Function to get URL statistics
export async function getUrlStats() {
  try {
    const recentUrls = await getRecentUrls()
    const stats = await Promise.all(
      recentUrls.map(async (url: any) => {
        const visits = (await redis.get<number>(`stats:${url.shortCode}`)) || 0
        return {
          ...url,
          visits,
        }
      }),
    )

    return stats
  } catch (error) {
    console.error("Error retrieving URL stats:", error)
    return []
  }
}
