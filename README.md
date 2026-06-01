# Presence

Presence is a paired presence Progressive Web App designed to synchronize working/focus states between two users without messages, feeds, or interruptions.

---

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Presence
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role API key (keep server-side only).
   - `NEXT_PUBLIC_PARTYKIT_HOST`: Your deployed PartyKit host address (e.g. `shared-silence.username.partykit.dev`).
   - `PARTYKIT_SECRET`: A shared secret string used to sign connection tokens between Next.js and PartyKit.
   - `NEXT_PUBLIC_APP_URL`: The base URL of your frontend application (e.g. `http://localhost:3000` in local dev).

4. **Run the local development server**:
   ```bash
   npm run dev
   ```

---

## Database

1. Open your project in the **Supabase Dashboard**.
2. Go to the **SQL Editor** tab.
3. Paste and run the contents of [supabase/schema.sql](file:///c:/Dev/Presence/supabase/schema.sql) to initialize the tables, unique pair constraints, and Row Level Security (RLS) policies.
4. Enable Supabase Auth with **Email (magic link)** as the only provider. Make sure to disable password and OAuth providers in your Supabase Auth provider settings.

---

## PartyKit

1. Login and deploy the PartyKit server:
   ```bash
   npx partykit deploy
   ```
2. Copy the resulting host address from the command output.
3. Update `NEXT_PUBLIC_PARTYKIT_HOST` in `.env.local` (and on Vercel) with this host address.

---

## Vercel

1. Import your cloned repository into **Vercel**.
2. Add all environment variables from `.env.example` in the project settings.
3. Deploy the project. Vercel will build and host the application according to the configured `vercel.json`.

---

## Sound files

Users must provide their own looping audio assets inside the public directory:
- `public/sounds/rain.mp3`
- `public/sounds/cafe.mp3`
- `public/sounds/forest.mp3`

*(Empty placeholder files have been created for development.)*

---

## PWA icons

Users must provide their own square icon assets:
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

*(A default high-quality minimalist PWA icon has been pre-generated and placed in these paths.)*
