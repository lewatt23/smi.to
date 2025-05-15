/**
 * UI Tests
 *
 * These tests verify the functionality of the UI components.
 * To run these tests, you would typically use React Testing Library and Jest.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import Home from "../../app/page"
import { UrlList } from "../../components/url-list"
import { UrlStats } from "../../components/url-stats"

// Mock the actions
jest.mock("../../app/actions", () => ({
  shortenUrl: jest.fn(),
  getRecentUrls: jest.fn(),
  getUrlStats: jest.fn(),
}))

import { shortenUrl, getRecentUrls, getUrlStats } from "../../app/actions"

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render the URL shortener form", () => {
    // Arrange & Act
    render(<Home />)

    // Assert
    expect(screen.getByText("URL Shortener")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter your URL/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Shorten URL/i })).toBeInTheDocument()
  })

  it("should shorten a URL when the form is submitted", async () => {
    // Arrange
    ;(shortenUrl as jest.Mock).mockResolvedValue({
      shortUrl: "https://smi.to/abc123",
      shortCode: "abc123",
    })

    render(<Home />)

    // Act
    fireEvent.change(screen.getByPlaceholderText(/Enter your URL/i), {
      target: { value: "https://example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Shorten URL/i }))

    // Assert
    await waitFor(() => {
      expect(shortenUrl).toHaveBeenCalledWith("https://example.com")
      expect(screen.getByText("https://smi.to/abc123")).toBeInTheDocument()
    })
  })

  it("should show an error message for invalid URLs", async () => {
    // Arrange
    ;(shortenUrl as jest.Mock).mockResolvedValue({
      error: "Invalid URL format",
    })

    render(<Home />)

    // Act
    fireEvent.change(screen.getByPlaceholderText(/Enter your URL/i), {
      target: { value: "not-a-url" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Shorten URL/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Invalid URL format")).toBeInTheDocument()
    })
  })
})

describe("UrlList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should display a list of recent URLs", async () => {
    // Arrange
    const mockUrls = [
      {
        originalUrl: "https://example.com",
        shortUrl: "https://smi.to/abc123",
        shortCode: "abc123",
        createdAt: new Date().toISOString(),
      },
    ]
    ;(getRecentUrls as jest.Mock).mockResolvedValue(mockUrls)

    // Act
    render(<UrlList />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText("https://smi.to/abc123")).toBeInTheDocument()
      expect(screen.getByText(/Original: https:\/\/example.com/i)).toBeInTheDocument()
    })
  })

  it("should display a message when no URLs are available", async () => {
    // Arrange
    ;(getRecentUrls as jest.Mock).mockResolvedValue([])

    // Act
    render(<UrlList />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No URLs have been shortened yet")).toBeInTheDocument()
    })
  })
})

describe("UrlStats Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should display URL statistics", async () => {
    // Arrange
    const mockStats = [
      {
        originalUrl: "https://example.com",
        shortUrl: "https://smi.to/abc123",
        shortCode: "abc123",
        createdAt: new Date().toISOString(),
        visits: 5,
      },
    ]
    ;(getUrlStats as jest.Mock).mockResolvedValue(mockStats)

    // Act
    render(<UrlStats />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText("URL Visit Details")).toBeInTheDocument()
      expect(screen.getByText("https://smi.to/abc123")).toBeInTheDocument()
      expect(screen.getByText("5 visits")).toBeInTheDocument()
    })
  })

  it("should display a message when no statistics are available", async () => {
    // Arrange
    ;(getUrlStats as jest.Mock).mockResolvedValue([])

    // Act
    render(<UrlStats />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No statistics available yet")).toBeInTheDocument()
    })
  })
})
