const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);
  const isAdmin = require('../middleware/isAdmin');

  // Configure email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Send email helper
  const sendEmail = async (to, subject, html) => {
    try {
      await transporter.sendMail({
        from: `"Golf For Good" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  };

  // Send winner notification
  router.post('/send-winner-notification', auth, isAdmin, async (req, res) => {
    const { winnerId } = req.body;

    try {
      const { data: winner } = await supabase
        .from('winners')
        .select(`
          *,
          users:user_id (email, full_name),
          draws:draw_id (draw_month, prize_pool, winning_numbers)
        `)
        .eq('id', winnerId)
        .single();

      if (!winner) {
        return res.status(404).json({ error: 'Winner not found' });
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .prize { font-size: 24px; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Congratulations!</h2>
            </div>
            <div class="content">
              <h3>Hello ${winner.users.full_name}!</h3>
              <p>Great news! You've won in our monthly draw!</p>
              <p><strong>Match Type:</strong> ${winner.match_type}</p>
              <p><strong>Prize Amount:</strong> <span class="prize">$${winner.prize_amount}</span></p>
              <p><strong>Winning Numbers:</strong> ${winner.draws.winning_numbers?.join(', ')}</p>
              <p>Please upload your score proof to claim your prize.</p>
              <a href="${process.env.CLIENT_URL}/dashboard">Go to Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(winner.users.email, `You Won! ${winner.match_type} - $${winner.prize_amount}`, emailHtml);
      res.json({ success: true });
    } catch (error) {
      console.error('Send winner notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  return router;
};