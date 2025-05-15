
# SMI.TO - Next.js URL Shortener


## Live url :  https://smito-mfou039ou-medjo-stanlys-projects.vercel.app/
  

This project is a URL shortener application built as a solution to the Semicolon coding challenge. It allows users to shorten long URLs, which are then accessible via a unique `smi.to/...` link. The application features a frontend to submit URLs and an API backend to handle the shortening logic and redirection.

  

Built with Next.js (React frontend, Node.js API routes) and MongoDB. Containerized with Docker for easy local development.

  

## Tech Stack

  

*  **Frontend:** Next.js (React, App Router/Pages Router)

*  **Backend:** Next.js (API Routes)

*  **Database:** MongoDB

*  **Containerization:** Docker & Docker Compose


  

## Features

  

*  **URL Shortening:** Accepts a long URL and generates a unique short identifier.

*  **Custom Base URL:** Shortened URLs are presented with the `smi.to` base (e.g., `smi.to/uniqueId`).

*  **Redirection:** Accessing a short URL redirects the user to the original long URL.

*  **Frontend Interface:** A simple UI to input long URLs and receive the shortened version.

*  **Visit Tracking (Bonus):** Tracks the number of visits for each shortened URL.

*  **Production-Ready Code:** Structured for clarity, maintainability, and future development.

*  **Dockerized Environment:** Easy setup for local development.

  

## Prerequisites

  

* [Node.js](https://nodejs.org/) (v18.x or later recommended)

* [npm](https://www.npmjs.com/) (comes with Node.js)

* [Docker](https://www.docker.com/get-started)

* [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

* Git

  

## Getting Started

  

### 1. Clone the Repository

```bash
git clone https://github.com/lewatt23/smi.to
cd smi.to
```

###  2. Environment Variables
This project uses environment variables for configuration.

**For Local Development with Docker:**

Create a .env file in the project root directory:


Then, edit the .env file. Key variables:

```bash
# .env

MONGODB_URI="mongodb://your_mongo_user:your_mongo_password@mongodb:27017/your_db_name?authSource=admin&retryWrites=true&w=majority"

```


-   **MONGODB_URI**: Ensure this matches your MongoDB setup. If using the mongodb service in docker-compose.yml, use the internal Docker network hostname mongodb.

### 3. Build and Run with Docker Compose
From the project root directory:

docker-compose up --build


The Next.js application will be accessible at http://localhost:3000 .
