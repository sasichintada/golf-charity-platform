const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);

  // Get user's last 5 scores
  router.get('/', auth, async (req, res) => {
    try {
      const { data: scores, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('score_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      res.json(scores);
    } catch (error) {
      console.error('Get scores error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add new score (implements 5-score rolling logic)
  router.post('/', [
    body('score').isInt({ min: 1, max: 45 }),
    body('scoreDate').isISO8601()
  ], auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { score, scoreDate } = req.body;

    try {
      // Check if user has active subscription
      if (req.user.subscription_status !== 'active') {
        return res.status(403).json({ error: 'Active subscription required to enter scores' });
      }

      // Get existing scores
      const { data: existingScores, error: fetchError } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('score_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Add new score
      const { data: newScore, error: insertError } = await supabase
        .from('scores')
        .insert({
          user_id: req.user.id,
          score,
          score_date: scoreDate
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If more than 5 scores, delete the oldest
      if (existingScores && existingScores.length >= 5) {
        const oldestScore = existingScores[existingScores.length - 1];
        await supabase
          .from('scores')
          .delete()
          .eq('id', oldestScore.id);
      }

      // Get updated scores list
      const { data: updatedScores } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', req.user.id)
        .order('score_date', { ascending: false })
        .limit(5);

      res.json(updatedScores);
    } catch (error) {
      console.error('Add score error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Update existing score
  router.put('/:id', [
    body('score').isInt({ min: 1, max: 45 }),
    body('scoreDate').isISO8601()
  ], auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { score, scoreDate } = req.body;

    try {
      const { data, error } = await supabase
        .from('scores')
        .update({
          score,
          score_date: scoreDate,
          updated_at: new Date()
        })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Update score error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};