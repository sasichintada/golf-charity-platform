import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trophy, Target, Gift, ArrowRight, Users, DollarSign } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: "Win Monthly Prizes",
      description: "Enter your scores and get a chance to win in our monthly draws with exciting prize pools up to $10,000!"
    },
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Support Charities",
      description: "Choose your favorite charity and automatically donate a portion of your subscription. Minimum 10% goes to charity."
    },
    {
      icon: <Target className="h-8 w-8 text-blue-500" />,
      title: "Track Performance",
      description: "Keep track of your last 5 Stableford scores and monitor your progress over time with detailed analytics."
    }
  ];

  const stats = [
    { number: "$50K+", label: "Raised for Charity", icon: Heart },
    { number: "2,500+", label: "Active Golfers", icon: Users },
    { number: "15+", label: "Partner Charities", icon: Target },
    { number: "$100K+", label: "Prizes Awarded", icon: Trophy }
  ];

  const howItWorks = [
    { step: 1, title: "Subscribe", description: "Choose monthly or yearly plan", icon: DollarSign },
    { step: 2, title: "Enter Scores", description: "Record your Stableford scores", icon: Target },
    { step: 3, title: "Support Charity", description: "Select your favorite cause", icon: Heart },
    { step: 4, title: "Win Prizes", description: "Participate in monthly draws", icon: Gift }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <Heart className="h-16 w-16 text-green-500" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Golf for a Cause
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Play golf, support charities, and win amazing prizes. Join thousands of golfers making a difference in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-8 py-3"
              >
                <span>Start Playing</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                to="/charities" 
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-8 py-3"
              >
                <Heart className="h-5 w-5" />
                <span>Explore Charities</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-green-600">{stat.number}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 max-w-2xl mx-auto"
            >
              Simple, transparent, and impactful - here's how you can get started
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center group hover:transform hover:-translate-y-2"
              >
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Getting Started</h2>
            <p className="text-gray-600">Join in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-2">{step.step}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make an Impact?</h2>
            <p className="text-green-100 mb-8 max-w-2xl mx-auto">
              Join our community of golfers who are making a difference while enjoying the game they love.
            </p>
            <Link 
              to="/register" 
              className="bg-white text-green-600 font-semibold py-3 px-8 rounded-xl hover:shadow-xl transition-all duration-200 inline-flex items-center space-x-2 transform hover:scale-105"
            >
              <span>Join Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;