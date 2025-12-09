# Standalone Admin Panel

This folder contains the standalone Admin Panel for Cheatloop.

## Setup & Deployment

1.  **Environment Variables**:
    Create a `.env` file in this directory (copy from `.env.example`) and fill in your Supabase credentials.
    
    ```env
    VITE_SUPABASE_URL="your_supabase_url"
    VITE_SUPABASE_ANON_KEY="your_anon_key"
    VITE_SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
    ```
    
    *Note: The Service Role Key is required for User Management features.*

2.  **Install Dependencies**:
    Run `npm install` or `yarn install` in this directory.

3.  **Run Locally**:
    Run `npm run dev` to start the admin panel locally.

4.  **Build for Production**:
    Run `npm run build`. The output will be in the `dist` folder.
    You can upload the contents of the `dist` folder to any static hosting service (Netlify, Vercel, Hostinger, etc.).

## Database
This application connects directly to your Supabase project defined in the `.env` file. No separate backend deployment is required.
