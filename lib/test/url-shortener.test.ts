/**
 * URL Shortener Tests
 *
 * These tests verify the functionality of the URL shortener service.
 * To run these tests, you would typically use Jest or another testing framework.
 */

// Mock Redis client
const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  incr: jest.fn(),
  lpush: jest.fn(),
  ltrim: jest.fn(),
  lrange: jest.fn(),
}

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: () => "abc123",
}))

// Mock the Redis client
jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => mockRedis,
  },
}))

// Mock Next.js cache revalidation
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

import { shortenUrl, getOriginalUrl, getRecentUrls, getUrlStats } from "../app/actions"

describe("URL Shortener Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("shortenUrl", () => {
    it("should shorten a valid URL", async () => {
      // Arrange
      const originalUrl = "https://example.com"
      mockRedis.set.mockResolvedValue("OK")
      mockRedis.lpush.mockResolvedValue(1)
      mockRedis.ltrim.mockResolvedValue("OK")

      // Act
      const result = await shortenUrl(originalUrl)

      // Assert
      expect(result).toEqual({
        shortUrl: "https://smi.to/abc123",
        shortCode: "abc123",
      })
      expect(mockRedis.set).toHaveBeenCalledWith("url:abc123", originalUrl)
      expect(mockRedis.set).toHaveBeenCalledWith("stats:abc123", 0)
    })

    it("should reject invalid URLs", async () => {
      // Act
      const result = await shortenUrl("not-a-url")

      // Assert
      expect(result).toEqual({ error: "Invalid URL format" })
    })
  })

  describe("getOriginalUrl", () => {
    it("should retrieve the original URL and increment visit count", async () => {
      // Arrange
      const shortCode = "abc123"
      const originalUrl = "https://example.com"
      mockRedis.get.mockResolvedValue(originalUrl)
      mockRedis.incr.mockResolvedValue(1)

      // Act
      const result = await getOriginalUrl(shortCode)

      // Assert
      expect(result).toEqual({ originalUrl })
      expect(mockRedis.get).toHaveBeenCalledWith("url:abc123")
      expect(mockRedis.incr).toHaveBeenCalledWith("stats:abc123")
    })

    it("should return an error for non-existent short codes", async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)

      // Act
      const result = await getOriginalUrl("nonexistent")

      // Assert
      expect(result).toEqual({ error: "URL not found" })
    })
  })

  describe("getRecentUrls", () => {
    it("should retrieve recent URLs", async () => {
      // Arrange
      const mockUrls = [
        JSON.stringify({
          originalUrl: "https://example.com",
          shortCode: "abc123",
          shortUrl: "https://smi.to/abc123",
          createdAt: "2023-01-01T00:00:00.000Z",
        }),
      ]
      mockRedis.lrange.mockResolvedValue(mockUrls)

      // Act
      const result = await getRecentUrls()

      // Assert
      expect(result).toEqual([
        {
          originalUrl: "https://example.com",
          shortCode: "abc123",
          shortUrl: "https://smi.to/abc123",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      ])
      expect(mockRedis.lrange).toHaveBeenCalledWith("recent_urls", 0, 9)
    })
  })

  describe("getUrlStats", () => {
    it("should retrieve URL statistics", async () => {
      // Arrange
      const mockUrls = [
        {
          originalUrl: "https://example.com",
          shortCode: "abc123",
          shortUrl: "https://smi.to/abc123",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      ]
      mockRedis.lrange.mockResolvedValue([JSON.stringify(mockUrls[0])])
      mockRedis.get.mockResolvedValue(5)

      // Act
      const result = await getUrlStats()

      // Assert
      expect(result).toEqual([
        {
          ...mockUrls[0],
          visits: 5,
        },
      ])
    })
  })
})
