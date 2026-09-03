# Spiritual Library

A free starter website for a spiritual e-library using React, Vite and Supabase.

## Features

- Search and filter books
- Hindi/English language filter
- Categories
- Book details
- Read PDF in browser
- Download PDF
- Admin login
- Upload cover + PDF
- Edit/delete books
- Supabase database + Storage

## 1. Create Supabase project

Create a free project at https://supabase.com/

Open SQL Editor and run `supabase.sql`.

Then create an admin user in Supabase:
Authentication -> Users -> Add user.

## 2. Configure environment

Copy `.env.example` to `.env` and enter your Supabase project URL and anon key.

Example:

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx

## 3. Set admin email

Open `src/App.jsx` and change:

const ADMIN_EMAILS = ["your-email@example.com"];

to the email you used for the Supabase admin user.

## 4. Run locally

npm install
npm run dev

## 5. Deploy free on Vercel

Push this folder to GitHub, import the repository into Vercel, and add the same two environment variables in:

Vercel -> Project -> Settings -> Environment Variables

Then deploy.

## Copyright

Only upload books/PDFs you are authorized to distribute. For Brahma Kumaris publications, follow the publisher's applicable permissions and copyright terms.
