# Coupon System API

## 🎯 Objective
One-time coupon per user with 100% discount and safe concurrency handling.

## 🛠 Tech Stack
- Node.js
- Express
- MongoDB

## 🔌 APIs

### Validate Coupon
POST /validate-coupon  
Checks if coupon is valid (no update)

### Apply Coupon
POST /apply-coupon  
Applies coupon and marks it as used

## 🧠 Key Idea
We use a unique index on (userId, couponId) so only one request can succeed even if many requests come at the same time.

## ▶️ Run Project
npm install  
node app.js