# Project: Nekonomi (Meal Planner & Pantry Manager)

## What I'm Building
A full-stack web and mobile application that simplifies meal planning and reduces food waste. The core insight is that existing solutions separate recipe discovery from pantry management — forcing users to manually reconcile the two. This app connects pantry inventory directly with recipe selection to reduce decision fatigue and improve shopping efficiency.

## Problem Being Solved
- People overlook ingredients they already have and default to repetitive meal choices
- Over-optimizing ingredient usage creates mental load and frustration
- Disconnected tools (recipe apps vs pantry trackers) require manual reconciliation
- Poor meal planning leads to unnecessary grocery purchases and food waste

## Objectives
- Reduce time spent making a meal plan
- Reduce mental load and decision fatigue
- Assist with grocery shopping (smarter lists based on what's missing)
- Reduce food waste
- Success metrics: fewer meals eaten out due to lack of preparation, fewer unsatisfying meals

## Core Features
- Pantry inventory tracking (ingredients, quantity, unit)
- Recipe management (browse, create, manage)
- Personalized meal suggestions based on available pantry ingredients
- Smart grocery list generation (what's missing for planned meals)

## Tech Stack
- **Platform:** Mobile-first Progressive Web App (PWA)
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** NextAuth.js (Google OAuth)

## Database Schema

### Tables
- **Users** — `id, email, created_on`
- **Ingredients** — `id, name, category` (category may be a choice list or M2M)
- **Pantry** — `id, quantity, unit, updated_on, ingredient_id (FK)`
- **GroceryList** — `id, ingredient_id (FK), quantity, unit, status, updated_on`
- **Recipes** — `id, user_id (FK), name, description, instructions, cook_time_minutes, created_on`
- **RecipeIngredients** — M2M between Recipes and Ingredients: `id, recipe_id (FK), ingredient_id (FK), quantity, unit, optional (bool)`

### Design Notes
- `Pantry`, `GroceryList`, and `RecipeIngredients` share overlapping fields (`quantity`, `unit`) — plan to use an abstract base model to DRY this up
- `Ingredients.category` will be a simple Choice List (streamlines grouping by grocery store aisle), reserving M2M tagging for the `Recipes` level.

## Current Status
Planning phase complete — architecture and schema decisions locked. Ready for scaffolding!

## Key Decisions Made
- **Architecture:** Mobile-first PWA to avoid dual codebases while supporting on-the-go grocery shopping.
- **Meal Generation:** Start with pure rule-based SQL queries to calculate match percentage against pantry inventory. AI enhancement is a future consideration.
- **Authentication:** Require accounts immediately via NextAuth.js (Google OAuth/Magic Links) to avoid painful data migrations later.
- **Quantities vs Boolean Matching:** For the MVP, the app will largely ignore strict fractional unit conversions (e.g. cups to gallons) and simply match based on whether the ingredient is *present* in the pantry.
- **Inventory Lifecycle:** Items will auto-add to the Pantry when checked off the Grocery List, but cooking a meal will NOT auto-deplete ingredients (to prevent partial items like mayo from being prematurely deleted). Depletion is manual.
