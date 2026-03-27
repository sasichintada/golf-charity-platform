const jwt = require('jsonwebtoken');

module.exports = (supabase) => {
  return async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Token is not valid' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token is not valid' });
    }
  };
};