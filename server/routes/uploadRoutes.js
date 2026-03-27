const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `proof_${req.user?.id || 'user'}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed'));
  }
});

module.exports = (supabase) => {
  const auth = require('../middleware/auth')(supabase);

  // Upload winner proof
  router.post('/winner-proof/:winnerId', auth, upload.single('proof'), async (req, res) => {
    try {
      // Verify winner belongs to user
      const { data: winner } = await supabase
        .from('winners')
        .select('*')
        .eq('id', req.params.winnerId)
        .eq('user_id', req.user.id)
        .single();

      if (!winner) {
        return res.status(404).json({ error: 'Winner not found' });
      }

      const proofUrl = `/uploads/proofs/${req.file.filename}`;
      
      const { data, error } = await supabase
        .from('winners')
        .update({
          proof_url: proofUrl,
          verification_status: 'pending_review',
          updated_at: new Date()
        })
        .eq('id', req.params.winnerId)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, proofUrl, message: 'Proof uploaded successfully' });
    } catch (error) {
      console.error('Upload proof error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  return router;
};