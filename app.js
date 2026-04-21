const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

/* ================== DB CONNECTION ================== */
mongoose.connect('mongodb://localhost:27017/couponDB')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================== MODELS ================== */

// Coupon Model
const Coupon = mongoose.model('Coupon', {
  code: String,
  isActive: Boolean
});

// UserCoupon Model (for one-time usage)
const userCouponSchema = new mongoose.Schema({
  userId: String,
  couponId: String
});

// 🔥 UNIQUE constraint (handles concurrency)
userCouponSchema.index({ userId: 1, couponId: 1 }, { unique: true });

const UserCoupon = mongoose.model('UserCoupon', userCouponSchema);

// Transaction Model
const Transaction = mongoose.model('Transaction', {
  userId: String,
  couponId: String,
  amount: Number,
  finalAmount: Number,
  status: String
});

/* ================== CREATE COUPON ================== */

app.get('/create-coupon', async (req, res) => {
  try {
    const existing = await Coupon.findOne({ code: "COUPON100" });

    if (!existing) {
      await Coupon.create({ code: "COUPON100", isActive: true });
    }

    res.send("Coupon ready");
  } catch (err) {
    res.send(err.message);
  }
});

/* ================== VALIDATE API ================== */

app.post('/validate-coupon', async (req, res) => {
  try {
    const { userId, couponId, amount } = req.body;

    // Check coupon
    const coupon = await Coupon.findOne({ code: couponId });

    if (!coupon || !coupon.isActive) {
      return res.json({ valid: false, message: "Invalid coupon" });
    }

    // Check usage
    const used = await UserCoupon.findOne({ userId, couponId });

    if (used) {
      return res.json({ valid: false, message: "Already used" });
    }

    return res.json({
      valid: true,
      finalAmount: 0
    });

  } catch (err) {
    res.json({ valid: false, message: err.message });
  }
});

/* ================== APPLY API ================== */

app.post('/apply-coupon', async (req, res) => {
  try {
    const { userId, couponId, amount } = req.body;

    // Validate again
    const coupon = await Coupon.findOne({ code: couponId });

    if (!coupon || !coupon.isActive) {
      return res.json({ success: false, message: "Invalid coupon" });
    }

    // 🔥 Try inserting (handles concurrency automatically)
    await UserCoupon.create({ userId, couponId });

    // Create transaction
    await Transaction.create({
      userId,
      couponId,
      amount,
      finalAmount: 0,
      status: "SUCCESS"
    });

    return res.json({
      success: true,
      message: "Coupon applied successfully"
    });

  } catch (err) {

    // Duplicate error = already used
    if (err.code === 11000) {
      return res.json({
        success: false,
        message: "Already used"
      });
    }

    return res.json({
      success: false,
      message: err.message
    });
  }
});

/* ================== SERVER ================== */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});