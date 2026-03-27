const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Get Razorpay key for frontend
  router.get('/key', auth, (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
  });

  // Create subscription order
  router.post('/create-order', auth, async (req, res) => {
    const { planType, planAmount } = req.body;

    try {
      const amount = planType === 'yearly' ? planAmount * 12 * 0.9 : planAmount;
      
      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: req.user.id,
          planType: planType
        }
      };

      const order = await razorpay.orders.create(options);

      // Store order in database
      await supabase
        .from('subscriptions')
        .insert({
          user_id: req.user.id,
          razorpay_order_id: order.id,
          plan_type: planType,
          amount: amount,
          status: 'created'
        });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify payment and activate subscription
  router.post('/verify-payment', auth, async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType
    } = req.body;

    try {
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Get order details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Calculate end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (planType === 'yearly' ? 12 : 1));

      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          razorpay_payment_id: razorpay_payment_id,
          status: 'active',
          current_period_start: new Date(),
          current_period_end: endDate
        })
        .eq('razorpay_order_id', razorpay_order_id);

      // Update user subscription status
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_type: planType,
          subscription_end_date: endDate
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Record payment
      await supabase
        .from('payments')
        .insert({
          user_id: req.user.id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          amount: subscription.amount,
          type: 'subscription',
          charity_amount: subscription.amount * (req.user.charity_percentage / 100),
          status: 'completed'
        });

      // Return updated user data with date
      res.json({ 
        success: true, 
        message: 'Payment verified and subscription activated',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          subscriptionStatus: updatedUser.subscription_status,
          subscription_end_date: updatedUser.subscription_end_date ? new Date(updatedUser.subscription_end_date).toISOString() : null,
          charityPercentage: updatedUser.charity_percentage,
          isAdmin: updatedUser.is_admin || false
        }
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel subscription
  router.post('/cancel', auth, async (req, res) => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: 'cancelled',
          subscription_end_date: new Date()
        })
        .eq('id', req.user.id);

      res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create donation order
  router.post('/donation-order', auth, async (req, res) => {
    const { amount, charityId } = req.body;

    try {
      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
        notes: {
          userId: req.user.id,
          charityId: charityId,
          type: 'donation'
        }
      };

      const order = await razorpay.orders.create(options);
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error('Create donation order error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify donation
  router.post('/verify-donation', auth, async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      charityId,
      amount
    } = req.body;

    try {
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Record donation
      await supabase
        .from('payments')
        .insert({
          user_id: req.user.id,
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          amount: amount,
          type: 'donation',
          charity_amount: amount,
          status: 'completed'
        });

      // Update charity total donations
      await supabase.rpc('increment_charity_donations', {
        charity_id: charityId,
        amount: amount
      });

      res.json({ success: true, message: 'Donation successful' });
    } catch (error) {
      console.error('Verify donation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};