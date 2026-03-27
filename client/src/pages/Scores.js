import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Calendar, Activity, AlertCircle, Check,Loader } from 'lucide-react';

const Scores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [formData, setFormData] = useState({
    score: '',
    scoreDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingScoreId, setUpdatingScoreId] = useState(null);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/scores`);
      setScores(response.data);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic update for editing scores
  const handleOptimisticUpdate = async (scoreId, updatedData) => {
    // Store original score for rollback
    const originalScore = scores.find(s => s.id === scoreId);
    
    // Immediately update UI
    setScores(prevScores => 
      prevScores.map(score => 
        score.id === scoreId 
          ? { ...score, ...updatedData, updated_at: new Date() }
          : score
      )
    );
    
    setUpdatingScoreId(scoreId);
    
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/scores/${scoreId}`, {
        score: parseInt(updatedData.score),
        scoreDate: updatedData.score_date
      });
      
      setSuccess('Score updated successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      // Rollback on error
      setScores(prevScores => 
        prevScores.map(score => 
          score.id === scoreId ? originalScore : score
        )
      );
      setError(error.response?.data?.error || 'Update failed. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingScoreId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (formData.score < 1 || formData.score > 45) {
      setError('Score must be between 1 and 45');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingScore) {
        // Use optimistic update for editing
        await handleOptimisticUpdate(editingScore.id, {
          score: parseInt(formData.score),
          score_date: formData.scoreDate
        });
        setShowForm(false);
        setEditingScore(null);
      } else {
        // For new scores, wait for response (need to maintain 5-score limit)
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/scores`, {
          score: parseInt(formData.score),
          scoreDate: formData.scoreDate
        });
        setScores(response.data);
        setSuccess('Score added successfully!');
        setTimeout(() => setSuccess(''), 2000);
      }
      
      setFormData({ score: '', scoreDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      setError(error.response?.data?.error || 'Error saving score');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (score) => {
    setEditingScore(score);
    setFormData({
      score: score.score,
      scoreDate: score.score_date.split('T')[0]
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingScore(null);
    setFormData({ score: '', scoreDate: new Date().toISOString().split('T')[0] });
    setError('');
  };

  const getScoreQuality = (score) => {
    if (score >= 36) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 30) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 24) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Golf Scores</h1>
          <p className="text-gray-600">Track your last 5 Stableford scores</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <Plus className="h-5 w-5" />
          <span>{showForm ? 'Cancel' : 'Add Score'}</span>
        </button>
      </motion.div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center"
          >
            <Check className="h-5 w-5 mr-2" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingScore ? 'Edit Score' : 'Add New Score'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stableford Score (1-45)
                </label>
                <input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  className="input-field"
                  min="1"
                  max="45"
                  required
                  placeholder="Enter your score"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stableford scoring: 1-45 points based on your performance
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Played
                </label>
                <input
                  type="date"
                  value={formData.scoreDate}
                  onChange={(e) => setFormData({ ...formData, scoreDate: e.target.value })}
                  className="input-field"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="btn-primary flex items-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>{editingScore ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{editingScore ? 'Update Score' : 'Save Score'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores List */}
      <div className="space-y-3">
        {scores.length > 0 ? (
          scores.map((score, index) => {
            const quality = getScoreQuality(score.score);
            const isUpdating = updatingScoreId === score.id;
            
            return (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex justify-between items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all group ${
                  isUpdating ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Activity className={`h-8 w-8 ${quality.color}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{score.score}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${quality.bg} ${quality.color}`}>
                        {quality.label}
                      </span>
                      {isUpdating && (
                        <Loader className="h-4 w-4 animate-spin text-blue-500 ml-2" />
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(score.score_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(score)}
                  className="text-blue-600 hover:text-blue-700 transition p-2 hover:bg-blue-50 rounded-lg"
                  disabled={isUpdating || isSubmitting}
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No scores entered yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-green-600 hover:text-green-700 font-semibold inline-flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add your first score</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Banner */}
      {scores.length === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-blue-800 text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            You've entered your maximum 5 scores. Adding a new score will automatically replace your oldest one.
          </p>
        </motion.div>
      )}

      {/* Score Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-4 bg-gray-50 rounded-lg"
      >
        <h3 className="font-semibold mb-2">Stableford Scoring Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="text-center">
            <div className="font-bold text-green-600">36+</div>
            <div className="text-gray-600">Excellent</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600">30-35</div>
            <div className="text-gray-600">Good</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-yellow-600">24-29</div>
            <div className="text-gray-600">Average</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-600">1-23</div>
            <div className="text-gray-600">Needs Improvement</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Scores;