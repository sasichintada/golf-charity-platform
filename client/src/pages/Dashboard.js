import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Heart, Calendar, Award, TrendingUp, Target, Crown, Upload, X, Loader } from 'lucide-react';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState({
    scores: [],
    winnings: [],
    nextDraw: null,
    totalWon: 0,
    totalEntered: 0
  });
  const [loading, setLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [scoresRes, winningsRes, drawsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/scores`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/draws/my-winnings`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/draws/latest`)
      ]);

      const totalWon = winningsRes.data.reduce((sum, win) => sum + (win.prize_amount || 0), 0);
      
      setStats({
        scores: scoresRes.data,
        winnings: winningsRes.data,
        nextDraw: drawsRes.data,
        totalWon,
        totalEntered: scoresRes.data.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!proofFile || !selectedWinner) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('proof', proofFile);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/upload/winner-proof/${selectedWinner.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert('Proof uploaded successfully! Admin will review your submission.');
      setShowProofModal(false);
      setProofFile(null);
      setSelectedWinner(null);
      fetchDashboardData();
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || 'Please try again'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'badge-success';
      case 'pending_review': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return '✓ Verified';
      case 'pending_review': return '⏳ Under Review';
      case 'rejected': return '✗ Rejected';
      default: return 'Pending';
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-gray-600">Here's your golf performance summary</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-8 w-8" />
              <span className="text-sm opacity-90">Total Winnings</span>
            </div>
            <div className="text-3xl font-bold">${stats.totalWon.toLocaleString()}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-8 w-8" />
              <span className="text-sm opacity-90">Charity Support</span>
            </div>
            <div className="text-3xl font-bold">{user?.charityPercentage || 10}%</div>
            <div className="text-sm mt-1">of subscription</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8" />
              <span className="text-sm opacity-90">Scores Entered</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalEntered}/5</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-8 w-8" />
              <span className="text-sm opacity-90">Next Draw</span>
            </div>
            <div className="text-lg font-bold">
              {stats.nextDraw ? new Date(stats.nextDraw.draw_month).toLocaleDateString() : 'TBA'}
            </div>
          </motion.div>
        </div>

        {/* Subscription Status - Fixed Date Display */}
        <div className="mb-8">
          <div className={`card ${user?.subscriptionStatus === 'active' ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <Crown className={`h-6 w-6 ${user?.subscriptionStatus === 'active' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="font-semibold">Subscription Status</h3>
                  <p className="text-sm text-gray-600">
                    {user?.subscriptionStatus === 'active' 
                      ? `Active - Renews on ${formatDate(user?.subscription_end_date)}`
                      : 'No active subscription'}
                  </p>
                </div>
              </div>
              {user?.subscriptionStatus !== 'active' && (
                <a href="/subscription" className="btn-primary text-sm py-2 px-4">
                  Subscribe Now
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Recent Scores and Winnings */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Scores */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Recent Scores
            </h2>
            {stats.scores.length > 0 ? (
              <div className="space-y-3">
                {stats.scores.map((score, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <span className="font-semibold text-lg">{score.score}</span>
                      <span className="text-gray-500 text-sm ml-2">Stableford points</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(score.score_date).toLocaleDateString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No scores entered yet</p>
                <a href="/scores" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                  Add your first score →
                </a>
              </div>
            )}
          </div>

          {/* Winnings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              My Winnings
            </h2>
            {stats.winnings.length > 0 ? (
              <div className="space-y-3">
                {stats.winnings.map((win, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{win.match_type}</span>
                        <span className={`badge ${getStatusBadge(win.verification_status)}`}>
                          {getStatusText(win.verification_status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {win.draws?.draw_month && new Date(win.draws.draw_month).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600 font-semibold">${win.prize_amount}</span>
                      {win.verification_status === 'pending' && !win.proof_url && (
                        <button
                          onClick={() => {
                            setSelectedWinner(win);
                            setShowProofModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Upload Proof"
                        >
                          <Upload className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No winnings yet</p>
                <p className="text-sm text-gray-400 mt-1">Keep playing and supporting charities!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proof Upload Modal */}
      <AnimatePresence>
        {showProofModal && selectedWinner && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowProofModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Upload Winner Proof</h3>
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleProofUpload} className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Winning: <span className="font-bold text-green-600">{selectedWinner.match_type}</span>
                    </p>
                    <p className="text-lg font-bold text-green-600">${selectedWinner.prize_amount}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Draw Date: {selectedWinner.draws?.draw_month && new Date(selectedWinner.draws.draw_month).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Please upload a screenshot of your score from the golf platform to verify your win.
                      Accepted formats: JPG, PNG, PDF (Max 5MB)
                    </p>
                    
                    <label className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition group">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2 group-hover:text-green-500 transition" />
                        <p className="text-sm text-gray-500 group-hover:text-gray-700">
                          {proofFile ? proofFile.name : 'Click to choose file'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF up to 5MB</p>
                        <input
                          type="file"
                          onChange={(e) => setProofFile(e.target.files[0])}
                          accept="image/*,.pdf"
                          className="hidden"
                          required
                        />
                      </div>
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={uploading || !proofFile}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Upload Proof</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Dashboard;