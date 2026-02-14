# 🗄️ Manual Database Setup Guide

Since `prisma db push` is having connection issues, follow these steps to set up your database manually:

---

## 📋 **Step-by-Step Instructions**

### Step 1: Open Neon Console

1. Go to **https://console.neon.tech**
2. Log in to your account
3. Select your project (the one with the database you're using)

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. You should see a text area where you can run SQL queries

### Step 3: Copy the SQL Schema

1. Open the file `database-setup.sql` (in your project root)
2. **Copy ALL the SQL** (Ctrl+A, then Ctrl+C)

### Step 4: Run the SQL

1. **Paste** the SQL into the Neon SQL Editor
2. Click **"Run"** or press **Ctrl+Enter**
3. Wait for the query to complete (should take 2-5 seconds)

### Step 5: Verify Tables Created

You should see a success message. To verify:

1. In Neon console, go to **"Tables"** tab
2. You should see 8 tables:
   - ✅ User
   - ✅ Account
   - ✅ Session
   - ✅ VerificationToken
   - ✅ DailyScore
   - ✅ Achievement
   - ✅ UserAchievement
   - ✅ Leaderboard

### Step 6: Test the Connection

Back in your terminal, run:

```bash
npx prisma db pull
```

This should confirm Prisma can now see your tables.

### Step 7: Restart Your App

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### Step 8: Test Sign-In

1. Open **http://localhost:9002**
2. Click **"Sign In with Google"**
3. Complete the Google sign-in
4. You should now stay logged in! ✅

---

## ✅ **What This Does**

The SQL creates:

1. **Authentication Tables** (User, Account, Session, VerificationToken)
   - Required for NextAuth.js to work
   - Stores your Google login info

2. **Game Data Tables** (DailyScore, Achievement, UserAchievement, Leaderboard)
   - Stores puzzle completions
   - Tracks achievements
   - Powers the leaderboard

3. **Indexes**
   - Optimizes database queries
   - Makes the app faster

---

## 🔍 **Troubleshooting**

### If SQL fails with "table already exists":
- That's OK! It means some tables are already there
- The `IF NOT EXISTS` clause prevents errors
- Just continue to the next step

### If you get permission errors:
- Make sure you're the owner of the Neon project
- Try creating a new database in Neon and update your `DATABASE_URL`

### If tables don't appear:
- Refresh the Neon console page
- Check you're looking at the correct database (should be "neondb")
- Try running the SQL again

---

## 🎯 **After Setup**

Once the tables are created:

1. ✅ **Google Sign-In** will work and persist
2. ✅ **Cloud Sync** will automatically save your scores
3. ✅ **Leaderboard** will show real data
4. ✅ **Cross-device** progress tracking works

---

## 💡 **Alternative: Use Prisma Migrate**

If you prefer using Prisma CLI (after database is accessible):

```bash
# Initialize migrations
npx prisma migrate dev --name init

# This creates the tables AND tracks schema changes
```

---

**Need help?** Check the Neon documentation: https://neon.tech/docs/get-started-with-neon/query-with-neon-sql-editor
