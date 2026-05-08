# 🍱 Nekonomi

**A smart Meal Planner & Pantry Manager built to reduce food waste and decision fatigue.**

> *Nekonomi* connects your pantry inventory directly with recipe selection to streamline meal planning and improve grocery shopping efficiency.

---

## 💡 The Problem

Existing solutions typically separate recipe discovery from pantry management, forcing you to manually reconcile the two. This leads to:
- Overlooking ingredients you already have.
- Defaulting to repetitive meal choices.
- Experiencing mental load and frustration trying to over-optimize ingredient usage.
- Unnecessary grocery purchases and food waste.

## 🎯 Objectives

- **Save Time:** Reduce the time spent making a meal plan.
- **Save Mental Energy:** Reduce decision fatigue when deciding "what's for dinner".
- **Save Money & Food:** Reduce food waste and limit unnecessary grocery runs.
- **Eat Better:** Fewer meals eaten out due to lack of preparation.

---

## ✨ Core Features

- **📦 Pantry Inventory Tracking:** Keep track of ingredients, quantities, and units.
- **🍳 Recipe Management:** Browse, create, and manage your favorite recipes.
- **🪄 Smart Meal Suggestions:** Personalized recipe recommendations based purely on what's currently available in your pantry.
- **🛒 Intelligent Grocery Lists:** Automatically generate shopping lists based on what's missing for your planned meals.
- **🔄 Auto-Migration:** Items automatically move to your Pantry when checked off the Grocery List.

---

## 🛠️ Tech Stack & Architecture

Nekonomi is built as a **Mobile-first Progressive Web App (PWA)** to avoid dual codebases while perfectly supporting on-the-go grocery shopping.

- **Framework:** Next.js (React App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Authentication:** NextAuth.js (Google OAuth)

### Key Architectural Decisions
- **Matching Engine:** Starts with pure rule-based SQL queries to calculate match percentage against pantry inventory (Boolean matching based on presence, ignoring fractional unit conversions for the MVP).
- **Inventory Lifecycle:** Cooking a meal does *not* auto-deplete ingredients. This prevents partial items (like a jar of mayo) from being prematurely deleted. Depletion is completely manual.
- **Data Integrity:** Accounts are required immediately via NextAuth.js to avoid painful anonymous data migrations later.

---

## 🚀 Getting Started

First, ensure you have **Node.js 22+** installed.

```bash
# Clone the repository
git clone https://github.com/KWongEE/Nekonomi.git
cd Nekonomi

# Install dependencies
npm install

# Setup your local environment variables
# Open .env.local and add your Neon DATABASE_URL
# Example: DATABASE_URL=postgresql://user:password@host/neondb

# Push the database schema
npx drizzle-kit push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
