# Logic Looper - Setup Guide

This guide will help you set up all the required services and configurations for the Logic Looper application.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Google account
- A Neon.tech account (for PostgreSQL database)
- A Google Cloud account (for OAuth and Gemini API)

---

## 🔑 Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key
4. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

---

## 🔐 Step 2: Set up Google OAuth

### Create OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Application type: "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:9002/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)
8. Copy Client ID and Client Secret
9. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

---

## 🗄️ Step 3: Set up Neon Database

### Create Database:

1. Go to [Neon.tech](https://neon.tech)
2. Sign up / Log in
3. Create a new project
4. Copy the connection string (starts with `postgresql://`)
5. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

---

## 🔧 Step 4: Generate NextAuth Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Add the output to `.env.local`:
```
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:9002
```

---

## 📦 Step 5: Install Dependencies

```bash
npm install
```

---

## 🗃️ Step 6: Initialize Database

### Generate Prisma Client:

```bash
npx prisma generate
```

### Push Schema to Database:

```bash
npx prisma db push
```

### (Optional) Seed Initial Data:

```bash
npx prisma db seed
```

---

## 🚀 Step 7: Run the Application

### Development Mode:

```bash
npm run dev
```

The app will be available at `http://localhost:9002`

---

## ✅ Verification Checklist

- [ ] Gemini API key is set and working (puzzles load)
- [ ] Google OAuth is configured (can sign in)
- [ ] Database is connected (no Prisma errors)
- [ ] NextAuth secret is generated
- [ ] All dependencies are installed
- [ ] Application runs without errors

---

## 🔍 Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env.local` file exists in root directory
- Verify the key is correct
- Restart the dev server after adding the key

### "OAuth Error: redirect_uri_mismatch"
- Check authorized redirect URIs in Google Cloud Console
- Ensure `http://localhost:9002/api/auth/callback/google` is added
- Match the port number (9002)

### "Prisma Client not found"
- Run `npx prisma generate`
- Restart the dev server

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure SSL mode is included in connection string

---

## 📝 Environment Variables Summary

Your `.env.local` should contain:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your_generated_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_neon_database_url
```

---

## 🎯 Next Steps

Once setup is complete:

1. Test sign in with Google
2. Complete a puzzle
3. Check if score syncs to database
4. View leaderboard
5. Test offline functionality

---

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all services (Neon, Google Cloud) are active
4. Try restarting the development server
5. Clear browser cache and cookies

---

**Setup Complete!** 🎉

Your Logic Looper application is now ready to use with full authentication and database support.
