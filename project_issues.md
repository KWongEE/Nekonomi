# Nekonomi Project Issues

---

## Issue #1: Initialize Next.js PWA & Drizzle Postgres Connection

### What to build
Set up the foundational mobile-first Next.js application using Tailwind CSS. Connect the application to a local/remote PostgreSQL database using Drizzle ORM. Build a basic health-check API route to confirm the database connection is passing. Configure standard PWA manifests so the app is installable on mobile devices.

### Acceptance criteria
- [ ] Next.js app is scaffolded and runs locally without errors.
- [ ] PWA manifest and icons are configured.
- [ ] Drizzle ORM is installed and successfully connects to a PostgreSQL database.
- [ ] A baseline `Users` schema is defined and migrated.

### Blocked by
None - can start immediately

---

## Issue #2: Implement NextAuth with Google OAuth

### What to build
Integrate NextAuth.js (Auth.js) into the Next.js application, locking down the primary routes so only authenticated users can access the app. Set up the Google Auth provider and ensure that logging in creates a corresponding user record in the database using the Drizzle NextAuth adapter.

### Acceptance criteria
- [ ] NextAuth.js is configured with the Google provider.
- [ ] Unauthenticated users are redirected to a login screen.
- [ ] Authenticated user sessions are correctly maintained.
- [ ] Database successfully stores and retrieves user sessions.

### Blocked by
- Issue #1

---

## Issue #3: End-to-end Pantry Add & View

### What to build
A full-stack slice allowing an authenticated user to view their personal pantry and add a new ingredient to it. This involves defining the `Ingredients` and `Pantry` Drizzle schemas, building the Next.js server actions/APIs to insert data, and creating a simple UI to list and add items.

### Acceptance criteria
- [ ] `Ingredients` and `Pantry` schemas are defined and migrated.
- [ ] UI allows a user to type an ingredient name and add it.
- [ ] The backend validates the input and links the item to the user's `user_id`.
- [ ] The UI displays a list of the user's current pantry items.

### Blocked by
- Issue #2

---

## Issue #4: Ingredient Categories and Pantry Item Deletion

### What to build
Enhance the existing pantry system to support categorization (modeling grocery store aisles like "Produce", "Dairy") via database Enums. Add functionality for users to manually delete an item from their pantry when it is depleted.

### Acceptance criteria
- [ ] `Ingredients` schema supports an aisle category Enum.
- [ ] The UI groups or filters pantry items by category.
- [ ] Each pantry item has a "Delete / Depleted" button.
- [ ] Clicking delete instantly removes the item from the database and updates the UI.

### Blocked by
- Issue #3

---

## Issue #5: Create Recipes and attach Required Ingredients

### What to build
Introduce the cookbook functionality. Define schemas for `Recipes` and the associative table `RecipeIngredients`. Build a UI slice that allows a user to create a new recipe (title, instructions, cook time) and explicitly attach required ingredients to it.

### Acceptance criteria
- [ ] `Recipes` and `RecipeIngredients` schemas are migrated.
- [ ] User can create a recipe with basic metadata.
- [ ] User can add multiple ingredients to a recipe upon creation.
- [ ] Recipe details page displays the list of required ingredients.

### Blocked by
- Issue #3

---

## Issue #6: M2M Recipe Category Tagging

### What to build
Add many-to-many metadata tagging to Recipes (e.g., "Vegan", "Spicy", "Quick"). Define the tags schema and allow users to attach and filter recipes by these tags.

### Acceptance criteria
- [ ] Tag schema and join table are migrated.
- [ ] Recipe creation/edit UI supports adding tags.
- [ ] Recipe list UI supports filtering by selected tags.

### Blocked by
- Issue #5

---

## Issue #7: Build the SQL "Availability Score" Engine and sorted UI

### What to build
The core logic engine of the application. Write the complex SQL/Drizzle query that determines an "Availability Score" by comparing the ingredients required for every recipe against the boolean presence of ingredients in the user's pantry. Display the cookbook sorted by this score.

### Acceptance criteria
- [ ] SQL query correctly calculates match percentages (e.g., 3 out of 4 ingredients owned = 75%).
- [ ] UI displays recipes sorted by the highest match percentage.
- [ ] Integration tests verify the sorting math works accurately against mock data.

### Blocked by
- Issue #5

---

## Issue #8: Generate Grocery List from missing Recipe target ingredients

### What to build
When a user selects a recipe to cook, the app should automatically parse the ingredients they *do not* have in their pantry, and push those missing elements into a new `GroceryList` table. 

### Acceptance criteria
- [ ] `GroceryList` schema is defined and migrated.
- [ ] User can click "Plan this Meal" on a recipe.
- [ ] Missing ingredients are accurately calculated and inserted into the Grocery List.
- [ ] User can view their Grocery List grouped by aisle categories.

### Blocked by
- Issue #7

---

## Issue #9: Check off Grocery items and Auto-Migrate to Pantry

### What to build
The data pipeline for grocery shopping. As the user checks items off their grocery list, those items should be securely transferred into the `Pantry` table, realizing the "one-way sync" lifecycle and preventing double data entry.

### Acceptance criteria
- [ ] Checking an item on the Grocery List updates its status to "purchased".
- [ ] Purchased items are automatically inserted or resolved in the `Pantry` table.
- [ ] Pipeline tests verify that duplicates are handled safely and data flows correctly end-to-end.

### Blocked by
- Issue #8
