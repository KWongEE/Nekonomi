# Product Requirements Document (PRD): Nekonomi

## Problem Statement

Users frequently overlook the ingredients they already have in their kitchen, resulting in repetitive meal choices or unnecessary trips to the supermarket. Traditional tools either focus strictly on recipe discovery or rigidly on pantry inventory, failing to bridge the gap. This disconnection requires users to manually reconcile what they have with what they *can* cook, causing decision fatigue, poor meal planning, and ultimately, food waste and wasted money.

## Solution

Nekonomi is a Mobile-First Progressive Web App (PWA) that acts as a unified meal planner and pantry manager. By directly connecting the user's pantry inventory with their recipe database, Nekonomi automatically generates smart meal suggestions based on the ingredients that are currently available. It eliminates the mental load of meal planning and automates the creation of grocery lists by calculating exactly what is missing to cook desired meals. 

## User Stories

1. As a new user, I want to sign in easily with my Google Account via OAuth, so that I don't have to remember another password and can securely sync my data across devices.
2. As a user in the kitchen, I want to access the application via a mobile browser and save it to my home screen as a PWA, so that it feels like a native app.
3. As a home cook, I want to add ingredients (e.g., "Milk", "Chicken") to my digital pantry, so that the system knows what I have available.
4. As a home cook, I want to categorize my ingredients by grocery store aisles (e.g., "Dairy", "Produce"), so that my future grocery lists are automatically organized for efficient shopping.
5. As an organizer, I want to manually remove or delete an ingredient from my pantry when I use the last bit of it, so that my inventory stays accurate.
6. As a recipe collector, I want to define new recipes with a title, description, instructions, and cook time, so that I have a personal cookbook.
7. As a recipe collector, I want to attach multiple ingredients to a given recipe, so that the system knows what is mathematically required to cook it.
8. As a recipe collector, I want to be able to tag recipes with Many-To-Many metadata (e.g., "Vegan", "Spicy"), so that I can easily filter my cookbook depending on my mood.
9. As a meal planner experiencing decision fatigue, I want the system to calculate an "Availability Score" for all my recipes against my current pantry inventory, so that I can immediately see which meals I am closest to being able to cook.
10. As a meal planner, I want to see recipes sorted by highest availability score first, so that I can prioritize using the food I already have and minimize food waste.
11. As a planner, I want the matching logic to rely on the boolean presence of an ingredient rather than exact fractional quantities, so that I don't have to rigidly transcribe volumetric measurements every time I shop.
12. As a shopper, I want to select a recipe that I want to cook, and have the system automatically isolate the missing ingredients and add them to my Grocery List, so that I don't have to manually figure out what I need to buy.
13. As a shopper in the supermarket, I want to view my active Grocery List grouped by ingredient category, so that I can cleanly execute my shopping without walking back and forth across the store.
14. As a shopper, I want to check off items on my Grocery List as I drop them in my cart, so that I know what is left to buy.
15. As a shopper checking out, I want the checked-off items to automatically migrate into my app's Pantry inventory, so that I don't undergo the double-labor of manually inputting my groceries when I get home.
16. As a home cook executing a recipe, I want to ensure my pantry items do NOT auto-deplete when I mark a meal as cooked, so that partial items (like a jar of mayo) aren't accidentally wiped from my inventory.

## Implementation Decisions

- **Architecture:** The application will be a mobile-first PWA built on the Next.js (React) framework using TypeScript. 
- **Database Engine:** PostgreSQL will serve as the relational database, hosted via Supabase or Neon.
- **ORM Module:** Drizzle ORM will be used to enforce database schemas and write complex SQL logic, favoring raw query speed and explicitness over abstraction.
- **Authentication:** `NextAuth.js` (Auth.js) will be implemented using a Google OAuth provider. All database rows involving proprietary user data will relate back to the NextAuth user ID.
- **Deep Modules Created:**
  - `auth`: Handles Next.js routing protection and session context.
  - `db`: Drizzle connection pooling and explicit schema file configurations for `Users`, `Ingredients`, `Pantry`, `GroceryList`, `Recipes`, and `RecipeIngredients`.
  - `pantry.manager`: Encapsulates CRUD actions for the pantry system.
  - `recipe.matcher`: Core logic module running a complex SQL `JOIN` mapping recipe requirements against the user's pantry. Returns a mathematically sorted array based on boolean matching (whether an ingredient is >0 in the pantry).
  - `grocery.sync`: Cross-table module that listens to Grocery List validation events to explicitly write those records into the Pantry table upon physical shopping completion.
- **Schema Simplification:** strict fractional unit conversions (e.g. comparing "gallons" to "teaspoons") have been cut from the MVP in favor of simple boolean presence.
- **Categorization:** Ingredient categories are simple string enums (Choice Lists) modeled after grocery store aisles. M2M tags are reserved strictly for the Recipe object layer.

## Testing Decisions

To ensure the integrity of Nekonomi's core value proposition, tests will focus heavily on validating the external API surface and behavioral inputs/outputs of our deep modules, rather than locking down implementation details.

- **`recipe.matcher`**: Will be heavily tested with integration tests. Mock pantries and recipes will be inserted into a test database. We will test the SQL sort calculation to ensure Recipes with 4/5 matching ingredients yield a higher availability score than 2/5.
- **`grocery.sync`**: We will test the data pipeline. Checking off an item must reliably insert the exact ingredient mapping into the `Pantry` table, resolving any duplicates effectively.
- **`pantry.manager`**: Will have tests covering straightforward validations, manual deletion triggers, and ignoring of fractional unit complexities.
- **Testing Approach:** Tests should treat the database as much like production as possible to ensure Drizzle ORM queries are executing safely without silent SQL failures.

## Out of Scope

- Strict mathematical unit conversions (volumetric vs weight mapping).
- Automatic depletion of pantry items when a cooking session is logged.
- Custom Machine Learning models for recipe recommendations (we will rely on SQL scoring).
- Native iOS or Android App Store distributions (App will be standalone PWA accessible via web browsers).
- Social sharing of pantries / Multi-tenant family sharing (MVP will assume 1 User Account : 1 Pantry).

## Further Notes

The UI must remain uncluttered and fast. Because users will be operating this inside a grocery store, low latency and large, touch-friendly interfaces are paramount. The taxonomy of Ingredient Categories should be defined out-of-the-box (e.g., Dairy, Meat, Produce, Spices, Dry Goods) so users don't have to invent their own aisle logic.
