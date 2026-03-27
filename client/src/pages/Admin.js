import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Users, Trophy, Heart, TrendingUp, Settings, Play,
  CheckCircle, XCircle, Plus, Edit2, Trash2,
  BarChart, DollarSign, Calendar, Award, Eye, RefreshCw, Upload
} from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawType, setDrawType] = useState('random');
  const [runDrawLoading, setRunDrawLoading] = useState(false);
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [editingCharity, setEditingCharity] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedCharityForEvent, setSelectedCharityForEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    eventType: 'golf_day'
  });
  const [charityForm, setCharityForm] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    featured: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        analyticsRes,
        usersRes,
        drawsRes,
        winnersRes,
        charitiesRes
      ] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/analytics`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/draws`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/winners`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/charities`)
      ]);

      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setDraws(drawsRes.data);
      setWinners(winnersRes.data);
      setCharities(charitiesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDraw = async () => {
    setRunDrawLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/draws/run`, { drawType });
      alert(`Draw completed! ${response.data.winners.length} winners found. Prize pool: $${response.data.draw.prize_pool}`);
      fetchData();
    } catch (error) {
      alert('Error running draw: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setRunDrawLoading(false);
    }
  };

  const simulateDraw = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/draws/simulate`, { drawType });
      setSimulationResult(response.data);
      alert(`Simulation complete!\n\nWinning Numbers: ${response.data.winningNumbers.join(', ')}\n5-Match: ${response.data.winners.fiveMatch.length}\n4-Match: ${response.data.winners.fourMatch.length}\n3-Match: ${response.data.winners.threeMatch.length}\nTotal Prize Pool: $${response.data.prizeDistribution.total}`);
    } catch (error) {
      alert('Error simulating draw: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const verifyWinner = async (winnerId, status) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/winners/${winnerId}/verify`, {
        status,
        paymentStatus: status === 'approved' ? 'paid' : 'rejected'
      });
      alert(`Winner ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      fetchData();
    } catch (error) {
      alert('Error verifying winner');
    }
  };

  const handleCharitySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', charityForm.name);
    formData.append('description', charityForm.description);
    formData.append('websiteUrl', charityForm.websiteUrl);
    formData.append('featured', charityForm.featured);
    if (charityForm.logo) {
      formData.append('logo', charityForm.logo);
    }

    try {
      if (editingCharity) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/charities/${editingCharity.id}`, formData);
        alert('Charity updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/charities`, formData);
        alert('Charity created successfully!');
      }
      fetchData();
      setShowCharityModal(false);
      setEditingCharity(null);
      setCharityForm({ name: '', description: '', websiteUrl: '', featured: false });
    } catch (error) {
      alert('Error saving charity');
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/charities/${selectedCharityForEvent.id}/events`, eventForm);
      alert('Event created successfully!');
      setShowEventModal(false);
      setEventForm({ title: '', description: '', eventDate: '', location: '', eventType: 'golf_day' });
      fetchData();
    } catch (error) {
      alert('Error creating event');
    }
  };

  const deleteCharity = async (id) => {
    if (window.confirm('Are you sure you want to delete this charity?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/charities/${id}`);
        alert('Charity deleted successfully!');
        fetchData();
      } catch (error) {
        alert('Error deleting charity');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart, color: 'green' },
    { id: 'users', label: 'Users', icon: Users, color: 'blue' },
    { id: 'draws', label: 'Draws', icon: Trophy, color: 'yellow' },
    { id: 'winners', label: 'Winners', icon: Award, color: 'purple' },
    { id: 'charities', label: 'Charities', icon: Heart, color: 'red' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Complete control over users, draws, and platform operations</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
              activeTab === tab.id
                ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600`
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? `text-${tab.color}-600` : ''}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-500" />
                <span className="text-sm text-gray-500">Total Users</span>
              </div>
              <div className="text-3xl font-bold">{analytics.users?.total || 0}</div>
              <div className="text-sm text-gray-600 mt-1">
                {analytics.users?.activeSubscriptions || 0} active
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <span className="text-sm text-gray-500">Total Revenue</span>
              </div>
              <div className="text-3xl font-bold">${analytics.finances?.totalRevenue?.toLocaleString() || 0}</div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-8 w-8 text-red-500" />
                <span className="text-sm text-gray-500">Charity Donated</span>
              </div>
              <div className="text-3xl font-bold">${analytics.finances?.totalCharityDonated?.toLocaleString() || 0}</div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <span className="text-sm text-gray-500">Current Jackpot</span>
              </div>
              <div className="text-3xl font-bold">${analytics.draws?.currentJackpot?.toLocaleString() || 0}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Winner Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>5-Match Winners</span>
                  <span className="font-bold text-yellow-600">{analytics.winners?.byType?.['5-match'] || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>4-Match Winners</span>
                  <span className="font-bold text-blue-600">{analytics.winners?.byType?.['4-match'] || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>3-Match Winners</span>
                  <span className="font-bold text-green-600">{analytics.winners?.byType?.['3-match'] || 0}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span>Pending Verifications</span>
                    <span className="text-yellow-600">{analytics.winners?.pendingVerifications || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Pending Payments</span>
                    <span className="text-orange-600">{analytics.winners?.pendingPayments || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Conversion Rate</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {analytics.users?.conversionRate || 0}%
                </div>
                <p className="text-gray-600">of registered users are active subscribers</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Free Users: {analytics.users?.total - analytics.users?.activeSubscriptions}</span>
                    <span>Premium: {analytics.users?.activeSubscriptions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charity %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4">{user.full_name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {user.subscription_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{user.charity_percentage}%</td>
                  <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {user.is_admin ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Draws Tab */}
      {activeTab === 'draws' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Run New Draw</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw Type</label>
                <select
                  value={drawType}
                  onChange={(e) => setDrawType(e.target.value)}
                  className="input-field"
                >
                  <option value="random">Random (Lottery Style)</option>
                  <option value="algorithmic">Algorithmic (Based on Most Frequent Scores)</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={runDraw}
                  disabled={runDrawLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>{runDrawLoading ? 'Running...' : 'Run Draw'}</span>
                </button>
                <button
                  onClick={simulateDraw}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Settings className="h-5 w-5" />
                  <span>Simulate</span>
                </button>
                <button
                  onClick={fetchData}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {draws.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Recent Draws</h2>
              <div className="space-y-4">
                {draws.slice(0, 5).map(draw => (
                  <div key={draw.id} className="border-b last:border-0 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {new Date(draw.draw_month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600">
                          Winning Numbers: {draw.winning_numbers?.join(', ') || 'Not generated'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-semibold">${draw.prize_pool?.toLocaleString()}</span>
                        <p className="text-xs text-gray-500">Pool Total</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Participants: {draw.total_participants || 0}</span>
                      <span>Status: {draw.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Winners Tab - FIXED: Shows buttons for both pending AND pending_review */}
      {activeTab === 'winners' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {winners.map(winner => (
                <tr key={winner.id}>
                  <td className="px-6 py-4">{winner.users?.full_name || winner.user_id}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${winner.match_type === '5-match' ? 'badge-success' : winner.match_type === '4-match' ? 'badge-info' : 'badge-warning'}`}>
                      {winner.match_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">${winner.prize_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${winner.verification_status === 'approved' ? 'badge-success' : winner.verification_status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {winner.verification_status === 'pending_review' ? 'Under Review' : winner.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${winner.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {winner.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Show buttons for pending OR pending_review */}
                    {(winner.verification_status === 'pending' || winner.verification_status === 'pending_review') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyWinner(winner.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => verifyWinner(winner.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charities Tab */}
      {activeTab === 'charities' && (
        <div>
          <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-semibold">Charity Management</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditingCharity(null);
                  setCharityForm({ name: '', description: '', websiteUrl: '', featured: false });
                  setShowCharityModal(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Charity</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charities.map(charity => (
              <div key={charity.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  {charity.logo_url ? (
                    <img src={charity.logo_url} alt={charity.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-green-500" />
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCharityForEvent(charity);
                        setShowEventModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-700"
                      title="Add Event"
                    >
                      <Calendar className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCharity(charity);
                        setCharityForm({
                          name: charity.name,
                          description: charity.description || '',
                          websiteUrl: charity.website_url || '',
                          featured: charity.featured
                        });
                        setShowCharityModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteCharity(charity.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{charity.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{charity.description}</p>
                {charity.featured && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Featured
                  </span>
                )}
                <div className="mt-3 text-sm text-gray-500">
                  Total Donations: ${charity.total_donations?.toLocaleString() || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charity Modal */}
      {showCharityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingCharity ? 'Edit Charity' : 'Add New Charity'}
            </h3>
            <form onSubmit={handleCharitySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={charityForm.name}
                    onChange={(e) => setCharityForm({ ...charityForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={charityForm.description}
                    onChange={(e) => setCharityForm({ ...charityForm, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={charityForm.websiteUrl}
                    onChange={(e) => setCharityForm({ ...charityForm, websiteUrl: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
                  <input
                    type="file"
                    onChange={(e) => setCharityForm({ ...charityForm, logo: e.target.files[0] })}
                    className="input-field"
                    accept="image/*"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={charityForm.featured}
                    onChange={(e) => setCharityForm({ ...charityForm, featured: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Featured Charity</label>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  {editingCharity ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCharityModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && selectedCharityForEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              Add Event for {selectedCharityForEvent.name}
            </h3>
            <form onSubmit={handleEventSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  <input
                    type="datetime-local"
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Pebble Beach Golf Links"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    className="input-field"
                  >
                    <option value="golf_day">Golf Day</option>
                    <option value="fundraiser">Fundraiser</option>
                    <option value="volunteer">Volunteer Event</option>
                    <option value="gala">Gala Dinner</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn-primary flex-1">Create Event</button>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;