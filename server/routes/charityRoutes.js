const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);

  // Get all charities
  router.get('/', async (req, res) => {
    try {
      const { data: charities, error } = await supabase
        .from('charities')
        .select('*')
        .order('featured', { ascending: false });

      if (error) throw error;
      res.json(charities);
    } catch (error) {
      console.error('Get charities error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get featured charities
  router.get('/featured', async (req, res) => {
    try {
      const { data: charities, error } = await supabase
        .from('charities')
        .select('*')
        .eq('featured', true)
        .limit(3);

      if (error) throw error;
      res.json(charities);
    } catch (error) {
      console.error('Get featured charities error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get single charity with events
  router.get('/:charityId', async (req, res) => {
    try {
      const { data: charity, error } = await supabase
        .from('charities')
        .select('*, charity_events(*)')
        .eq('id', req.params.charityId)
        .single();

      if (error) throw error;
      res.json(charity);
    } catch (error) {
      console.error('Get charity error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get charity events
  router.get('/:charityId/events', async (req, res) => {
    try {
      const { data: events, error } = await supabase
        .from('charity_events')
        .select('*')
        .eq('charity_id', req.params.charityId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;
      res.json(events || []);
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update user's selected charity
  router.put('/select', auth, async (req, res) => {
    const { charityId, percentage } = req.body;

    try {
      const updateData = {
        selected_charity_id: charityId,
        updated_at: new Date()
      };

      if (percentage !== undefined && percentage >= 10 && percentage <= 100) {
        updateData.charity_percentage = percentage;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        selectedCharityId: data.selected_charity_id,
        charityPercentage: data.charity_percentage
      });
    } catch (error) {
      console.error('Update charity error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};