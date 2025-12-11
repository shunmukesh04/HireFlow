# Database Setup Guide

## 1. Create a MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Sign up and create a FREE cluster.

## 2. Whitelist Your IP (Fix for "Network Error")
1. In Atlas dashboard, go to **Security** -> **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**. 
   *This is required for the backend to connect.*

## 3. Get Connection String
1. Go to **Database** -> **Connect**.
2. Select **Drivers** (Node.js).
3. Copy the string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0...mongodb.net/...`

## 4. Update Backend
1. Open `backend/.env`.
2. Paste your string into `MONGO_URI`.
3. Replace `<password>` with your actual database user password.
4. Restart the server (`npm run dev`).
