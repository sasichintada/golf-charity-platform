import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Award, Info } from 'lucide-react';

const Draws = () => {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraw, setSelectedDraw] = useState(null);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/draws/latest`);
      setDraws(response.data ? [response.data] : []);
    } catch (error) {
      console.error('Error fetching draws:', error);
    } finally {
      setLoading(false);
    }
  };

  // getMatchColor function is not used in the component, so it's removed
  // If you need it later, uncomment below:
  // const getMatchColor = (matchType) => {
  //   switch(matchType) {
  //     case '5-match': return 'bg-yellow-100 text-yellow-800';
  //     case '4-match': return 'bg-blue-100 text-blue-800';
  //     case '3-match': return 'bg-green-100 text-green-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

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
        <h1 className="text-3xl font-bold mb-2">Monthly Draws</h1>
        <p className="text-gray-600">
          Participate in our monthly draws by entering your scores. Every active subscription gives you a chance to win!
        </p>
      </motion.div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">How Draws Work</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3">
            <div className="font-bold text-green-600 mb-1">Step 1</div>
            <div>Subscribe to the platform</div>
          </div>
          <div className="text-center p-3">
            <div className="font-bold text-green-600 mb-1">Step 2</div>
            <div>Enter your last 5 Stableford scores</div>
          </div>
          <div className="text-center p-3">
            <div className="font-bold text-green-600 mb-1">Step 3</div>
            <div>Get matched with winning numbers monthly</div>
          </div>
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">5-Number Match</h3>
          <div className="text-2xl font-bold text-yellow-600">40%</div>
          <p className="text-sm text-gray-500 mt-2">Jackpot - Rollover if unclaimed</p>
        </div>
        <div className="card text-center">
          <Award className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">4-Number Match</h3>
          <div className="text-2xl font-bold text-blue-600">35%</div>
          <p className="text-sm text-gray-500 mt-2">Split among winners</p>
        </div>
        <div className="card text-center">
          <Award className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">3-Number Match</h3>
          <div className="text-2xl font-bold text-green-600">25%</div>
          <p className="text-sm text-gray-500 mt-2">Split among winners</p>
        </div>
      </div>

      {/* Previous Draws */}
      <h2 className="text-2xl font-bold mb-6">Previous Draws</h2>
      
      {draws.length > 0 ? (
        <div className="space-y-4">
          {draws.map((draw, index) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">
                      {new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Winning Numbers: </span>
                    <span className="font-mono font-bold text-lg">
                      {draw.winning_numbers?.join(', ') || 'Not generated'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">${draw.prize_pool?.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Prize Pool</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Participants</div>
                  <div className="font-bold text-lg">{draw.total_participants || 0}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Draw Type</div>
                  <div className="font-bold text-lg capitalize">{draw.draw_type || 'Random'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Jackpot</div>
                  <div className="font-bold text-lg">${draw.jackpot_amount?.toLocaleString() || 0}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDraw(selectedDraw?.id === draw.id ? null : draw)}
                className="mt-4 text-green-600 hover:text-green-700 text-sm flex items-center"
              >
                {selectedDraw?.id === draw.id ? 'Hide Details' : 'View Prize Distribution'}
              </button>

              {selectedDraw?.id === draw.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="font-semibold mb-2">Prize Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>5-Number Match (40%)</span>
                      <span className="font-semibold">${(draw.prize_pool * 0.4).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4-Number Match (35%)</span>
                      <span className="font-semibold">${(draw.prize_pool * 0.35).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3-Number Match (25%)</span>
                      <span className="font-semibold">${(draw.prize_pool * 0.25).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No draws have been conducted yet</p>
          <p className="text-sm text-gray-400 mt-2">The first draw will happen soon!</p>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-12 p-6 bg-white rounded-xl">
        <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-green-600">How are winners selected?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Winners are selected based on matching your entered scores with randomly generated numbers. 
              The more scores you enter, the higher your chances of matching!
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-green-600">When are draws held?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Draws are held monthly on the last day of each month. Results are published within 48 hours.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-green-600">What happens if no one wins the jackpot?</h4>
            <p className="text-sm text-gray-600 mt-1">
              The jackpot rolls over to the next month, increasing the potential prize pool!
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-green-600">How do I claim my prize?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Winners will be notified via email. Upload your score proof in the dashboard, and admin will verify and process your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draws;