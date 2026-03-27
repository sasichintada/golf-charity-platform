import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart, Search, Calendar, MapPin, ExternalLink, X, Gift, TrendingUp, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Charities = () => {
  const { user, updateUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [charityEvents, setCharityEvents] = useState([]);
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState(user?.charityPercentage || 10);
  const [updating, setUpdating] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    fetchCharities();
    loadRazorpayKey();
    loadRazorpayScript();
  }, []);

  const loadRazorpayKey = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/key`);
      setRazorpayKey(response.data.key);
    } catch (error) {
      console.error('Error loading Razorpay key:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        setScriptLoaded(true);
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        setScriptLoaded(false);
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const fetchCharities = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/charities`);
      setCharities(response.data);
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharityEvents = async (charityId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/charities/${charityId}/events`);
      setCharityEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setCharityEvents([]);
    }
  };

  const handleSelectCharity = async (charity) => {
    setSelectedCharity(charity);
    setSelectedPercentage(user?.charityPercentage || 10);
    setShowCharityModal(true);
  };

  const handleUpdateCharity = async () => {
    setUpdating(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/charities/select`, {
        charityId: selectedCharity.id,
        percentage: selectedPercentage
      });
      
      updateUser({
        ...user,
        selectedCharityId: selectedCharity.id,
        charityPercentage: selectedPercentage
      });
      
      alert(`You're now supporting ${selectedCharity.name} with ${selectedPercentage}% of your subscription!`);
      setShowCharityModal(false);
      fetchCharities();
    } catch (error) {
      alert('Error updating charity selection');
    } finally {
      setUpdating(false);
    }
  };

  const processDonation = async () => {
    if (!razorpayKey || !scriptLoaded) {
      alert('Payment system is loading. Please try again.');
      setDonationLoading(false);
      return;
    }

    if (!window.Razorpay) {
      alert('Payment system not available. Please refresh the page.');
      setDonationLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/donation-order`, {
        amount: parseFloat(donationAmount),
        charityId: selectedCharity.id
      });

      const { orderId, amount, currency } = response.data;

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'Golf For Good',
        description: `Donation to ${selectedCharity.name}`,
        order_id: orderId,
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/verify-donation`, {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              charityId: selectedCharity.id,
              amount: parseFloat(donationAmount)
            });
            
            if (verifyResponse.data.success) {
              alert(`Thank you for your donation of $${donationAmount} to ${selectedCharity.name}!`);
              setShowDonationModal(false);
              setDonationAmount('');
              fetchCharities();
            } else {
              alert('Donation verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Donation verification failed. Please contact support.');
          }
          setDonationLoading(false);
        },
        prefill: {
          name: user?.fullName,
          email: user?.email
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: () => {
            setDonationLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Create donation order error:', error);
      alert(error.response?.data?.error || 'Error creating donation order. Please try again.');
      setDonationLoading(false);
    }
  };

  const handleDonation = async () => {
    if (!donationAmount || donationAmount < 1) {
      alert('Please enter a valid donation amount');
      return;
    }

    if (!selectedCharity) {
      alert('Please select a charity first');
      return;
    }

    if (!scriptLoaded) {
      alert('Payment system is loading. Please try again.');
      return;
    }

    setDonationLoading(true);
    
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = async () => {
        await processDonation();
      };
      script.onerror = () => {
        alert('Failed to load payment system. Please refresh the page.');
        setDonationLoading(false);
      };
      document.body.appendChild(script);
    } else {
      await processDonation();
    }
  };

  const openEventsModal = async (charity) => {
    setSelectedCharity(charity);
    await fetchCharityEvents(charity.id);
    setShowEventsModal(true);
  };

  const filteredCharities = charities.filter(charity =>
    charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    charity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Charities We Support</h1>
        <p className="text-gray-600">
          Choose a charity to support with a portion of your subscription, or make a one-time donation
        </p>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <Heart className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-green-600">15+</div>
          <div className="text-sm text-gray-600">Partner Charities</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <Gift className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-blue-600">$50K+</div>
          <div className="text-sm text-gray-600">Donated to Date</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
          <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-purple-600">1,200+</div>
          <div className="text-sm text-gray-600">Active Supporters</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search charities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Charities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCharities.map((charity, index) => (
          <motion.div
            key={charity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card group hover:transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {charity.logo_url ? (
                  <img src={charity.logo_url} alt={charity.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{charity.name}</h3>
                  {charity.featured && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              {charity.total_donations > 0 && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    ${charity.total_donations.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Raised</div>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {charity.description || 'Making a difference through golf and community engagement.'}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => openEventsModal(charity)}
                className="flex-1 flex items-center justify-center space-x-1 text-sm text-green-600 hover:text-green-700 py-2 px-3 rounded-lg hover:bg-green-50 transition"
              >
                <Calendar className="h-4 w-4" />
                <span>Events</span>
              </button>
              
              {user && (
                <>
                  <button
                    onClick={() => handleSelectCharity(charity)}
                    className="flex-1 flex items-center justify-center space-x-1 text-sm bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition"
                  >
                    <Heart className="h-4 w-4" />
                    <span>Support</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedCharity(charity);
                      setShowDonationModal(true);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 text-sm border border-green-500 text-green-600 py-2 px-3 rounded-lg hover:bg-green-50 transition"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Donate</span>
                  </button>
                </>
              )}
            </div>
            
            {charity.website_url && (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-end"
              >
                Visit Website <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charity Selection Modal */}
      {showCharityModal && selectedCharity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Support {selectedCharity.name}</h3>
              <button
                onClick={() => setShowCharityModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose what percentage of your subscription you'd like to donate to this charity.
                Minimum 10% required.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charity Contribution Percentage
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={selectedPercentage}
                  onChange={(e) => setSelectedPercentage(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">10%</span>
                  <span className="text-lg font-bold text-green-600">
                    {selectedPercentage}%
                  </span>
                  <span className="text-sm text-gray-600">100%</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Your monthly contribution:</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(20 * selectedPercentage / 100).toFixed(2)}/month
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on monthly subscription of $20
                </p>
              </div>
              
              <button
                onClick={handleUpdateCharity}
                disabled={updating}
                className="btn-primary w-full"
              >
                {updating ? 'Updating...' : `Support ${selectedCharity.name}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonationModal && selectedCharity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Donate to {selectedCharity.name}</h3>
              <button
                onClick={() => setShowDonationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Make a one-time donation to support this charity's mission.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (USD)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[10, 25, 50, 100, 250, 500].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDonationAmount(amount)}
                      className={`py-2 px-3 rounded-lg border transition ${
                        donationAmount === amount 
                          ? 'border-green-500 bg-green-50 text-green-600'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="input-field"
                  placeholder="Or enter custom amount"
                  min="1"
                />
              </div>
              
              <button
                onClick={handleDonation}
                disabled={donationLoading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {donationLoading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5" />
                    <span>Donate ${donationAmount || '0'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && selectedCharity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
          >
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <h3 className="text-xl font-semibold">{selectedCharity.name}</h3>
                <p className="text-sm text-gray-500">Upcoming Events</p>
              </div>
              <button
                onClick={() => setShowEventsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {charityEvents.length > 0 ? (
              <div className="space-y-4">
                {charityEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    {event.image_url && (
                      <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover rounded-lg mb-3" />
                    )}
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                      {event.event_type && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming events scheduled at this time.</p>
                <p className="text-sm text-gray-400 mt-2">Check back later for updates!</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Charities;