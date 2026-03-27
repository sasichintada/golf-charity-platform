const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);

  // Get latest draw
  router.get('/latest', async (req, res) => {
    try {
      const { data: draw, error } = await supabase
        .from('draws')
        .select('*')
        .order('draw_month', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(draw || null);
    } catch (error) {
      console.error('Get latest draw error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get user's winnings
  router.get('/my-winnings', auth, async (req, res) => {
    try {
      const { data: winners, error } = await supabase
        .from('winners')
        .select(`
          *,
          draws:draw_id (
            draw_month,
            winning_numbers,
            prize_pool
          )
        `)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(winners || []);
    } catch (error) {
      console.error('Get winners error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};