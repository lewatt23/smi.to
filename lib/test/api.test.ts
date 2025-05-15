/**
 * API Tests
 *
 * These tests verify the functionality of the API endpoints.
 * To run these tests, you would typically use Jest or another testing framework.
 */

// Mock the actions module
jest.mock("../../app/actions", () => ({
  shortenUrl: jest.fn(),
  getOriginalUrl: jest.fn(),
}))

import { shortenUrl, getOriginalUrl } from "../../app/actions"
import { POST } from "../../app/api/shorten/route"
import { GET } from "../../app/api/redirect/[shortCode]/route"

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/shorten", () => {
    it("should return a shortened URL for valid input", async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ url: "https://example.com" }),
      } as unknown as Request
      ;(shortenUrl as jest.Mock).mockResolvedValue({
        shortUrl: "https://smi.to/abc123",
        shortCode: "abc123",
      })

      // Act
      const response = await POST(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        shortUrl: "https://smi.to/abc123",
        shortCode: "abc123",
      })
      expect(shortenUrl).toHaveBeenCalledWith("https://example.com")
    })

    it("should return an error for missing URL", async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Request

      // Act
      const response = await POST(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "URL is required" })
    })

    it("should return an error when shortening fails", async () => {
      // Arrange
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ url: "https://example.com" }),
      } as unknown as Request
      ;(shortenUrl as jest.Mock).mockResolvedValue({
        error: "Failed to shorten URL",
      })

      // Act
      const response = await POST(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Failed to shorten URL" })
    })
  })

  describe("GET /api/redirect/[shortCode]", () => {
    it("should redirect to the original URL", async () => {
      // Arrange
      const mockRequest = {} as Request
      const mockParams = { shortCode: "abc123" }
      ;(getOriginalUrl as jest.Mock).mockResolvedValue({
        originalUrl: "https://example.com",
      })

      // Mock NextResponse.redirect
      const mockRedirect = jest.fn().mockReturnValue({ status: 302 })
      jest.mock("next/server", () => ({
        NextResponse: {
          redirect: mockRedirect,
          json: jest.fn(),
        },
      }))

      // Act
      const response = await GET(mockRequest, { params: mockParams })

      // Assert
      expect(getOriginalUrl).toHaveBeenCalledWith("abc123")
      expect(response.status).toBe(302)
    })

    it("should return 404 for non-existent short codes", async () => {
      // Arrange
      const mockRequest = {} as Request
      const mockParams = { shortCode: "nonexistent" }
      ;(getOriginalUrl as jest.Mock).mockResolvedValue({
        error: "URL not found",
      })

      // Mock NextResponse.json
      const mockJson = jest.fn().mockReturnValue({ status: 404 })
      jest.mock("next/server", () => ({
        NextResponse: {
          redirect: jest.fn(),
          json: mockJson,
        },
      }))

      // Act
      const response = await GET(mockRequest, { params: mockParams })

      // Assert
      expect(getOriginalUrl).toHaveBeenCalledWith("nonexistent")
      expect(response.status).toBe(404)
    })
  })
})
