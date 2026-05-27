# 🦸 Marvel Trading Card Album

> A full-stack web application to collect, trade and discover Marvel heroes — powered by the official Marvel API.

![Status](https://img.shields.io/badge/status-completed-success)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20Marvel%20API-orange)
![Languages](https://img.shields.io/badge/HTML-79.7%25-blue) ![Languages](https://img.shields.io/badge/JavaScript-18.5%25-yellow)

---

## 📖 About the Project

Marvel Album is a web application where users can build their own personal collection of Marvel hero cards by purchasing random packs, trading with other users, and exploring the Marvel universe through comics, series and authors.

The project integrates the **official Marvel API** to fetch real character, comic and series data, and is structured as a full-stack web app with a Node.js backend and documented REST endpoints via **Swagger**.

---

## ✨ Features

### 🎴 Collection & Packs
- Buy random card packs from the in-app shop
- Build your personal album of Marvel heroes
- View detailed character cards

### 🔄 Trading System
- Marketplace to browse cards from other users
- Search and propose trades
- Manage incoming and outgoing trade requests

### 📚 Marvel Universe Explorer
- Browse comics with detailed views
- Explore series and their creators
- Discover authors behind the comics
- Save your favorite heroes, comics and authors

### 👤 User Accounts
- Sign up and login system
- Personal profile page
- Personalized collection and favorites

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | HTML5, CSS3, Vanilla JavaScript     |
| Backend      | Node.js + Express                   |
| API Docs     | Swagger / OpenAPI                   |
| Data Storage | JSON file storage                   |
| External API | Marvel API (developer.marvel.com)   |

---

## 📁 Project Structure

```
APImarvel/
├── server.js              # Express server & API routes
├── script.js              # Frontend logic
├── style.css              # Global styling
├── swagger.js             # Swagger configuration
├── swagger-output.json    # Generated API documentation
├── users.json             # User data storage
├── package.json
│
├── home.html              # Landing page
├── login.html             # Login page
├── registrat.html         # Registration page
├── utente.html            # User profile
│
├── album.html             # Personal card album
├── card.html              # Card detail view
├── shop.html              # Pack shop
│
├── mercato.html           # Trading marketplace
├── scambi.html            # Active trades
├── cerca-scambio.html     # Find trades
│
├── autori.html            # Authors browser
├── comicDetails.html      # Comic detail page
├── seriesDetails.html     # Series detail page
│
├── preferiti.html         # Favorite heroes
├── preferiti_autori.html  # Favorite authors
└── preferiti_fumetti.html # Favorite comics
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16+ and **npm**
- A **Marvel API account** → [developer.marvel.com](https://developer.marvel.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Minanoukola/APImarvel.git
cd APImarvel

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
MARVEL_PUBLIC_KEY=your_public_key
MARVEL_PRIVATE_KEY=your_private_key
PORT=3000
```

### Run the application

```bash
node server.js
```

The app will be available at `http://localhost:3000`.

API documentation is available at `http://localhost:3000/api-docs` (via Swagger UI).

---

## 📡 API Documentation

REST endpoints are documented with **Swagger / OpenAPI**. Once the server is running, the interactive documentation is available at:

```
http://localhost:3000/api-docs
```

---

## 🗺️ Roadmap

- [ ] Migration from JSON file storage to MongoDB
- [ ] Password hashing with bcrypt
- [ ] Session-based authentication with JWT
- [ ] Card rarity system
- [ ] Mobile-responsive design
- [ ] Unit and integration tests

---

## 👤 Author

**Mina Noukola** — Cybersecurity Student @ Università degli Studi di Milano

- 🔗 LinkedIn: [linkedin.com/in/minanoukola](https://www.linkedin.com/in/minanoukola)
- 📧 Email: minanoukola02@gmail.com

---

## ⚠️ Disclaimer

Marvel and all related characters are © Marvel Entertainment, LLC. This project is a **non-commercial academic work** developed for educational purposes only, using the public Marvel API.
