# PostApp

A full-stack, containerized social media application featuring user authentication, post creation, comments, likes, and a friends system. Built with React for the frontend, FastAPI for the backend, and orchestrated with Docker for a production-ready environment.

## Advanced Features & Infrastructure

- **Dockerized Architecture:** Fully containerized using `docker-compose` with isolated services for the frontend, backend API, database, caching layer, and reverse proxy.
- **Enterprise-Grade Database:** Migrated from SQLite to **PostgreSQL** for robust, concurrent data handling.
- **Redis Integration:** Utilizes **Redis** for high-speed data caching and potential background task queuing.
- **Nginx Reverse Proxy:** Includes an **Nginx** container to properly route traffic and serve as a robust entry point for the backend.
- **Modern Build Tooling:** Uses **Vite** for blazing-fast frontend builds and Hot Module Replacement (HMR).

## Core Features

- **Authentication:** Secure JWT-based login and registration with rate limiting.
- **Feed & Posts:** Create, edit, delete, and view posts. The feed supports pagination for optimal performance.
- **Interactions:** Like and comment on posts.
- **Friends System:** Send, accept, and reject friend requests. View your connections and share posts with them.
- **Responsive Design:** Fully responsive UI that works seamlessly on desktop and mobile devices.

## Technology Stack

- **Frontend:** React, Vite, React Router DOM, Custom CSS
- **Backend:** Python 3.13, FastAPI, SQLAlchemy, Pydantic
- **Infrastructure:** Docker, Docker Compose, Nginx
- **Databases:** PostgreSQL (Primary DB), Redis (Caching)

---

##  Getting Started

### Recommended: Running with Docker (Easiest)

Running the app via Docker handles all dependencies, databases, and network configurations automatically.

1. Ensure **Docker** and **Docker Desktop** are installed and running.
2. Clone the repository and navigate to the root directory.
3. Set up your environment variables:
   - Copy the provided `.env.example` to `.env` (or configure your own `POSTGRES_PASSWORD`, `SECRET_KEY`, etc.)
4. Build and start all services:
   ```bash
   docker compose up --build
