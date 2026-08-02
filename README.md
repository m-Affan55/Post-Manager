# PostApp

A full-stack social media application featuring user authentication, post creation, comments, likes, and a friends system. Built with React for the frontend and FastAPI for the backend.

## Features

-   **Authentication:** Secure JWT-based login and registration with rate limiting.
-   **Feed & Posts:** Create, edit, delete, and view posts. The feed supports pagination for performance.
-   **Interactions:** Like and comment on posts.
-   **Friends System:** Send, accept, and reject friend requests. View your connections and share posts with them.
-   **Responsive Design:** Fully responsive UI that works seamlessly on desktop and mobile devices.

## Technology Stack

-   **Frontend:** React, Vite, React Router DOM.
-   **Backend:** FastAPI, SQLAlchemy, SQLite (Development).
-   **Styling:** Custom CSS.

## Getting Started

### Prerequisites

-   Node.js (for frontend)
-   Python 3.8+ (for backend)

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Create a virtual environment: `python -m venv venv`
3.  Activate the virtual environment:
    -   Windows: `venv\Scripts\activate`
    -   Mac/Linux: `source venv/bin/activate`
4.  Install dependencies: `pip install -r requirements.txt` (Assuming a requirements.txt exists, or manually install fastap, uvicorn, sqlalchemy, etc.)
5.  Set up the `.env` file (A sample configuration should be created, you will need to generate a `SECRET_KEY`).
6.  Start the server: `uvicorn main:app --reload`

### Frontend Setup

1.  Navigate to the root directory (where `package.json` is located).
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

## Recent Updates (Security & Performance)

-   Implemented a cryptographically secure `SECRET_KEY` and JWT token expiry.
-   Added robust input validation using Pydantic schemas.
-   Fixed user enumeration vulnerabilities during login.
-   Enforced proper ownership authorization (403 Forbidden) for editing/deleting posts.
-   Added pagination (`skip`/`limit`) to feed and post endpoints to prevent memory exhaustion.
-   Implemented rate limiting using `slowapi` to protect authentication routes.
-   Centralized API configuration and improved error handling on the frontend.
-   Enhanced mobile responsiveness across all components.
