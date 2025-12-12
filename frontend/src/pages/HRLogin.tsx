import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { motion } from 'framer-motion';
import { Users, BarChart2, Clock, CheckCircle } from 'lucide-react';

const HRLogin: React.FC = () => {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Smart Candidate Matching",
      description: "AI-powered matching to find the best talent"
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track hiring metrics and performance"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time-Saving Tools",
      description: "Automate repetitive tasks and save hours"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Seamless Integration",
      description: "Works with your existing HR tools"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Branding and Features */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-orange-600 to-orange-700 p-8 md:p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto h-full flex flex-col justify-center"
        >
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to HireFlow</h1>
            <p className="text-orange-100">Streamline your hiring process with our powerful recruitment platform.</p>
          </div>
          
          <div className="space-y-6 mt-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-blue-100 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">HR Portal</h2>
              <p className="text-gray-500 text-sm md:text-base">Sign in to access your dashboard</p>
            </div>

            <div className="w-full">
              <SignIn
                afterSignInUrl="/hr-dashboard"
                signUpUrl="/hr-signup"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none w-full p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md",
                    socialButtonsBlockButton: "border-gray-300 text-gray-600 hover:bg-gray-50 text-sm normal-case py-2.5 px-4 rounded-lg font-medium transition-all duration-200",
                    formFieldInput: "rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3 px-4 text-gray-900 placeholder-gray-500 transition-all duration-200",
                    footerAction: "hidden",
                    form: "space-y-4",
                    formFieldLabel: "text-gray-700 font-medium text-sm mb-1.5",
                    formFieldRow: "flex flex-col space-y-4",
                    identityFlowEditButton: "text-blue-600 hover:text-blue-700 text-sm font-medium",
                    formFieldSuccess: "text-green-600 text-xs mt-1",
                    formFieldError: "text-red-600 text-xs mt-1"
                  }
                }}
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-4">Don't have an account?</p>
              <a 
                href="/hr-signup" 
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Sign up
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HRLogin;
