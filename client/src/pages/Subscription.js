import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Heart, AlertCircle, Shield, Loader } from 'lucide-react';

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const plans = {
    monthly: { 
      name: 'Monthly', 
      price: 20, 
      id: 'monthly',
      description: 'Perfect for casual players',
      features: ['Enter unlimited scores', 'Participate in monthly draws', 'Support your chosen charity', 'Cancel anytime']
    },
    yearly: { 
      name: 'Yearly', 
      price: 200, 
      id: 'yearly', 
      savings: 17,
      description: 'Best value for dedicated golfers',
      features: ['All monthly features', 'Save $40 per year', 'Priority support', 'Exclusive member events']
    }
  };

  useEffect(() => {
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

  const handleSubscribe = async () => {
  if (!scriptLoaded) {
    setError('Payment system is loading. Please try again.');
    return;
  }

  if (!window.Razorpay) {
    setError('Payment system not available. Please refresh the page.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const orderResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/create-order`, {
      planType: selectedPlan,
      planAmount: plans[selectedPlan].price
    });

    const { orderId, amount, currency } = orderResponse.data;

    // ✅ BLUR FIX START
    document.body.classList.add('razorpay-open');
    // ✅ BLUR FIX END

    const options = {
      key: razorpayKey,
      amount: amount,
      currency: currency,
      name: 'Golf For Good',
      description: `${plans[selectedPlan].name} Subscription`,
      order_id: orderId,

      handler: async (response) => {
        try {
          const verifyResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/verify-payment`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planType: selectedPlan
          });

          if (verifyResponse.data.success) {
            if (verifyResponse.data.user) {
              updateUser(verifyResponse.data.user);
            }

            alert('Subscription successful! Welcome!');
            window.location.href = '/dashboard';
          } else {
            setError('Payment verification failed.');
          }
        } catch (error) {
          setError('Payment verification failed.');
        }
      },

      modal: {
        ondismiss: () => {
          // ✅ BLUR FIX CLEANUP
          document.body.classList.remove('razorpay-open');
          setLoading(false);
        },
        escape: true,
        backdropclose: false
      },

      prefill: {
        name: user?.fullName,
        email: user?.email
      },

      theme: {
        color: '#10b981'
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    setError('Failed to create subscription.');
  } finally {
    setLoading(false);
  }
};

  // Helper function to format date
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

  if (user?.subscriptionStatus === 'active') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">You're Already Subscribed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for being a member. Your active subscription gives you access to all features.
        </p>
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-green-800">Subscription Type: {user.subscriptionType || 'Monthly'}</p>
          <p className="text-green-800 text-sm">
            Renews on: {formatDate(user?.subscription_end_date)}
          </p>
        </div>
        <a href="/dashboard" className="btn-primary inline-block">
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <Sparkles className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Join our community and start making an impact today
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {Object.entries(plans).map(([key, plan]) => (
          <motion.div
            key={key}
            whileHover={{ y: -5 }}
            className={`cursor-pointer p-8 rounded-2xl transition-all ${
              selectedPlan === key
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-2xl'
                : 'bg-white border-2 border-gray-200 hover:border-green-300'
            }`}
            onClick={() => setSelectedPlan(key)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className={`text-sm mt-1 ${selectedPlan === key ? 'text-green-100' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>
              {selectedPlan === key && <Check className="h-6 w-6" />}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              {key === 'monthly' && <span className={`text-lg ${selectedPlan === key ? 'text-green-100' : 'text-gray-600'}`}>/month</span>}
              {key === 'yearly' && <span className={`text-lg ${selectedPlan === key ? 'text-green-100' : 'text-gray-600'}`}>/year</span>}
              {plan.savings && (
                <span className={`inline-block ml-3 px-2 py-1 rounded text-sm ${
                  selectedPlan === key ? 'bg-green-600' : 'bg-green-100 text-green-600'
                }`}>
                  Save {plan.savings}%
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center">
                  <Check className={`h-5 w-5 mr-2 flex-shrink-0 ${selectedPlan === key ? 'text-white' : 'text-green-500'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Selected Plan:</span>
            <span className="text-lg font-bold text-green-600">
              {plans[selectedPlan].name} - ${plans[selectedPlan].price}
              {selectedPlan === 'monthly' ? '/month' : '/year'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Charity Contribution (min 10%):</span>
            <span>${(plans[selectedPlan].price * 0.1).toFixed(2)}</span>
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>Your selected charity:</span>
              <span className="font-medium">{user?.selectedCharityId ? 'Selected' : 'Choose in dashboard'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading || !scriptLoaded}
          className="btn-primary w-full flex items-center justify-center space-x-2 text-lg py-4"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Heart className="h-5 w-5" />
              <span>Subscribe {plans[selectedPlan].name}</span>
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Shield className="h-4 w-4" />
          <span>Secure payment powered by Razorpay</span>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          30-day money-back guarantee. Cancel anytime.
        </p>
      </motion.div>

      {/* FAQ Section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-center mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-600">
            <p>Q: Can I cancel my subscription anytime?</p>
            <p className="text-gray-500">A: Yes, you can cancel anytime from your dashboard.</p>
          </div>
          <div className="text-center text-sm text-gray-600">
            <p>Q: How does the charity contribution work?</p>
            <p className="text-gray-500">A: 10% minimum of your subscription goes to your chosen charity. You can increase this percentage in your dashboard.</p>
          </div>
          <div className="text-center text-sm text-gray-600">
            <p>Q: What happens if I don't win?</p>
            <p className="text-gray-500">A: Your subscription still supports charities and gives you entry into future draws!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;