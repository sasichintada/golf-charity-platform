const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);
  const isAdmin = require('../middleware/isAdmin');
  const DrawController = require('../controllers/drawController');

  // ============ USER MANAGEMENT ============
  router.get('/users', auth, isAdmin, async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(users || []);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.put('/users/:id', auth, isAdmin, async (req, res) => {
    const { fullName, email, subscriptionStatus, charityPercentage, isAdmin: makeAdmin } = req.body;
    try {
      const updateData = {
        full_name: fullName,
        email: email,
        subscription_status: subscriptionStatus,
        charity_percentage: charityPercentage,
        updated_at: new Date()
      };
      if (makeAdmin !== undefined) updateData.is_admin = makeAdmin;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // ============ DRAW MANAGEMENT ============
  router.get('/draws', auth, isAdmin, async (req, res) => {
    try {
      const { data: draws, error } = await supabase
        .from('draws')
        .select('*')
        .order('draw_month', { ascending: false });

      if (error) throw error;
      res.json(draws || []);
    } catch (error) {
      console.error('Get draws error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.post('/draws/run', auth, isAdmin, async (req, res) => {
    const { drawType = 'random' } = req.body;
    try {
      const drawController = new DrawController(supabase);
      const result = await drawController.runDraw(drawType, req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Run draw error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/draws/simulate', auth, isAdmin, async (req, res) => {
    const { drawType = 'random' } = req.body;
    try {
      const drawController = new DrawController(supabase);
      const simulation = await drawController.simulateDraw(drawType);
      res.json(simulation);
    } catch (error) {
      console.error('Simulate draw error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/draws/:drawId/publish', auth, isAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .update({ 
          status: 'published', 
          published_at: new Date(),
          published_by: req.user.id
        })
        .eq('id', req.params.drawId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Publish draw error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // ============ WINNERS MANAGEMENT - FIXED VERSION ============
  router.get('/winners', auth, isAdmin, async (req, res) => {
    try {
      console.log('Fetching winners...');
      
      // First, get all winners
      const { data: winners, error: winnersError } = await supabase
        .from('winners')
        .select('*')
        .order('created_at', { ascending: false });

      if (winnersError) {
        console.error('Winners query error:', winnersError);
        throw winnersError;
      }

      if (!winners || winners.length === 0) {
        return res.json([]);
      }

      // Get user IDs from winners
      const userIds = [...new Set(winners.map(w => w.user_id).filter(id => id))];
      const drawIds = [...new Set(winners.map(w => w.draw_id).filter(id => id))];

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Users fetch error:', usersError);
      }

      // Fetch draws
      const { data: draws, error: drawsError } = await supabase
        .from('draws')
        .select('id, draw_month, winning_numbers')
        .in('id', drawIds);

      if (drawsError) {
        console.error('Draws fetch error:', drawsError);
      }

      // Create maps for quick lookup
      const userMap = new Map();
      users?.forEach(user => userMap.set(user.id, user));

      const drawMap = new Map();
      draws?.forEach(draw => drawMap.set(draw.id, draw));

      // Combine data
      const enrichedWinners = winners.map(winner => ({
        ...winner,
        users: userMap.get(winner.user_id) || { full_name: 'Unknown', email: 'unknown@example.com' },
        draws: drawMap.get(winner.draw_id) || { draw_month: null, winning_numbers: [] }
      }));

      console.log(`Returning ${enrichedWinners.length} winners`);
      res.json(enrichedWinners);
    } catch (error) {
      console.error('Get winners error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.put('/winners/:winnerId/verify', auth, isAdmin, upload.single('proof'), async (req, res) => {
    const { status, paymentStatus } = req.body;
    const proofUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
      const updateData = {
        verification_status: status,
        payment_status: paymentStatus,
        verified_by: req.user.id,
        verified_at: new Date(),
        updated_at: new Date()
      };
      if (proofUrl) updateData.proof_url = proofUrl;

      const { data, error } = await supabase
        .from('winners')
        .update(updateData)
        .eq('id', req.params.winnerId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Verify winner error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // ============ CHARITY MANAGEMENT ============
  router.get('/charities', auth, isAdmin, async (req, res) => {
    try {
      const { data: charities, error } = await supabase
        .from('charities')
        .select('*')
        .order('featured', { ascending: false });

      if (error) throw error;
      res.json(charities || []);
    } catch (error) {
      console.error('Get charities error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.post('/charities', auth, isAdmin, upload.single('logo'), async (req, res) => {
    const { name, description, websiteUrl, featured } = req.body;
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const { data, error } = await supabase
        .from('charities')
        .insert({
          name,
          description,
          logo_url: logoUrl,
          website_url: websiteUrl,
          featured: featured === 'true'
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Create charity error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.put('/charities/:id', auth, isAdmin, upload.single('logo'), async (req, res) => {
    const { name, description, websiteUrl, featured } = req.body;
    const updateData = {
      name,
      description,
      website_url: websiteUrl,
      featured: featured === 'true',
      updated_at: new Date()
    };
    if (req.file) updateData.logo_url = `/uploads/${req.file.filename}`;

    try {
      const { data, error } = await supabase
        .from('charities')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update charity error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  router.delete('/charities/:id', auth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('charities')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Delete charity error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  // ============ CHARITY EVENTS MANAGEMENT ============
  router.post('/charities/:charityId/events', auth, isAdmin, upload.single('image'), async (req, res) => {
    const { title, description, eventDate, location, eventType } = req.body;
    const imageUrl = req.file ? `/uploads/events/${req.file.filename}` : null;

    try {
      const { data, error } = await supabase
        .from('charity_events')
        .insert({
          charity_id: req.params.charityId,
          title,
          description,
          event_date: eventDate,
          location,
          image_url: imageUrl,
          event_type: eventType || 'general'
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Failed to create event', details: error.message });
    }
  });

  router.delete('/events/:eventId', auth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('charity_events')
        .delete()
        .eq('id', req.params.eventId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({ error: 'Failed to delete event', details: error.message });
    }
  });

  // ============ ANALYTICS - FIXED VERSION ============
  router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
      console.log('Fetching analytics...');
      
      // Get user statistics
      const { count: totalUsers, error: userCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (userCountError) console.error('User count error:', userCountError);
      
      const { count: activeSubscriptions, error: activeError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');
      
      if (activeError) console.error('Active count error:', activeError);
      
      // Get financial statistics
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, type, charity_amount')
        .eq('status', 'completed');
      
      if (paymentsError) console.error('Payments error:', paymentsError);
      
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalCharityDonated = payments?.reduce((sum, p) => sum + (p.charity_amount || 0), 0) || 0;
      
      // Get draw statistics
      const { data: draws, error: drawsError } = await supabase
        .from('draws')
        .select('prize_pool, jackpot_amount, status');
      
      if (drawsError) console.error('Draws error:', drawsError);
      
      const totalPrizePool = draws?.reduce((sum, d) => sum + (d.prize_pool || 0), 0) || 0;
      const currentJackpot = draws?.find(d => d.status === 'pending')?.jackpot_amount || 0;
      
      // Get winner statistics
      const { data: winners, error: winnersError } = await supabase
        .from('winners')
        .select('match_type, verification_status, payment_status');
      
      if (winnersError) console.error('Winners error:', winnersError);
      
      const winnersByType = {
        '5-match': winners?.filter(w => w.match_type === '5-match').length || 0,
        '4-match': winners?.filter(w => w.match_type === '4-match').length || 0,
        '3-match': winners?.filter(w => w.match_type === '3-match').length || 0
      };
      
      const pendingVerifications = winners?.filter(w => w.verification_status === 'pending' || w.verification_status === 'pending_review').length || 0;
      const pendingPayments = winners?.filter(w => w.payment_status === 'pending').length || 0;
      
      const conversionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(2) : 0;
      
      res.json({
        users: { 
          total: totalUsers || 0, 
          activeSubscriptions: activeSubscriptions || 0, 
          conversionRate 
        },
        finances: { 
          totalRevenue: totalRevenue || 0, 
          totalCharityDonated: totalCharityDonated || 0 
        },
        draws: { 
          totalPrizePool: totalPrizePool || 0, 
          drawsCount: draws?.length || 0, 
          currentJackpot: currentJackpot || 0 
        },
        winners: {
          byType: winnersByType,
          pendingVerifications: pendingVerifications || 0,
          pendingPayments: pendingPayments || 0
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  return router;
};