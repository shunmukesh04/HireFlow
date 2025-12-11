import { useEffect, useState } from 'react';
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/Logo';
import HeroWave from '../components/ui/dynamic-wave-canvas-background';

// Quotes data
const quotes = [
  {
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    author: "Steve Jobs",
    bg: 'from-indigo-600 to-blue-600'
  },
  {
    text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
    author: "Steve Jobs",
    bg: 'from-purple-600 to-indigo-600'
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    bg: 'from-blue-600 to-cyan-500'
  }
];

export default function Landing() {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();

    const userRole = user?.publicMetadata?.role as string | undefined;

    // State for quote carousel
    const [currentQuote, setCurrentQuote] = useState(0);

    // Auto-redirect based on role
    useEffect(() => {
        if (isSignedIn && userRole === 'HR') {
            navigate('/hr-dashboard');
        } else if (isSignedIn && userRole === 'STUDENT') {
            navigate('/student-dashboard');
        }
    }, [isSignedIn, userRole, navigate]);

    // Auto-rotate quotes
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    // Loading state
    if (isSignedIn && !userRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing your dashboard...</p>
                </div>
            </div>
        );
    }

    // Main landing page
    if (!isSignedIn) {
        return (
            <div className="min-h-screen flex flex-col relative">
                {/* HeroWave Background */}
                <div className="fixed inset-0 w-full h-full -z-10">
                    <HeroWave />
                </div>
                
                {/* Header with Logo */}
                <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 bg-white/90 backdrop-blur-sm shadow-sm">
                    <div className="container mx-auto flex justify-between items-center">
                        <Logo withText={true} onClick={() => navigate('/')} />
                        <div className="hidden md:flex space-x-6">
                            <a href="#features" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">Features</a>
                            <a href="#how-it-works" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">How It Works</a>
                            <a href="#testimonials" className="text-slate-700 hover:text-indigo-600 font-medium transition-colors">Testimonials</a>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 pt-24 pb-16 md:pt-32">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Column - Content */}
                            <div className="text-center lg:text-left">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6"
                                >
                                    Find Your Perfect <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">Career Match</span>
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0"
                                >
                                    Connecting top talent with world-class companies through AI-powered recruitment solutions.
                                    Streamline your hiring process or find your dream job today.
                                </motion.p>

                                {/* CTA Buttons */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                                >
                                    <button 
                                        onClick={() => navigate('/hr-login')}
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        I'm Hiring
                                    </button>
                                    <button 
                                        onClick={() => navigate('/student-login')}
                                        className="px-8 py-4 bg-white text-indigo-600 font-semibold border-2 border-indigo-100 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                                    >
                                        Find a Job
                                    </button>
                                </motion.div>
                            </div>

                            {/* Right Column - Image/Illustration */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl">
                                    <img 
                                        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                                        alt="Team collaboration"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-100 rounded-full -z-10"></div>
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-100 rounded-full -z-10"></div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Quotes Section */}
                    <div className="mt-24 md:mt-32 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 -skew-y-3 transform origin-top-left"></div>
                        <div className="container mx-auto px-4 py-16 relative">
                            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-800 mb-12">
                                What People Are Saying
                            </h2>
                            
                            <div className="max-w-4xl mx-auto relative h-64">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentQuote}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.5 }}
                                        className={`absolute inset-0 p-8 rounded-2xl bg-gradient-to-r ${quotes[currentQuote].bg} text-white shadow-lg`}
                                    >
                                        <div className="h-full flex flex-col justify-center items-center text-center">
                                            <svg className="h-10 w-10 mb-6 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                            </svg>
                                            <p className="text-lg md:text-xl italic mb-6">"{quotes[currentQuote].text}"</p>
                                            <p className="font-semibold">— {quotes[currentQuote].author}</p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                                
                                {/* Quote indicators */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                                    {quotes.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuote(index)}
                                            className={`w-3 h-3 rounded-full ${currentQuote === index ? 'bg-white' : 'bg-white/50'}`}
                                            aria-label={`View quote ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Features Section */}
                    <section id="features" className="py-20 bg-white">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-800 mb-4">
                                Powerful Features
                            </h2>
                            <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16">
                                Everything you need to streamline your hiring process or find your dream job
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[
                                    {
                                        icon: (
                                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        ),
                                        title: "AI-Powered Matching",
                                        description: "Our advanced algorithms match candidates with the perfect job opportunities based on skills, experience, and culture fit."
                                    },
                                    {
                                        icon: (
                                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        ),
                                        title: "Easy Application",
                                        description: "Apply to multiple positions with just one click using your comprehensive profile."
                                    },
                                    {
                                        icon: (
                                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ),
                                        title: "Time-Saving",
                                        description: "Reduce hiring time with automated screening and smart candidate ranking."
                                    }
                                ].map((feature, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                                        <p className="text-slate-600">{feature.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
                
                {/* Footer */}
                <footer className="bg-slate-900 text-white pt-16 pb-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <Logo withText={true} className="mb-4" />
                <p className="text-slate-400">Transforming the way companies hire and candidates find jobs.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">For Candidates</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Browse Jobs</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Create Profile</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Job Alerts</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Career Advice</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">For Employers</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Post a Job</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Browse Candidates</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Recruitment Solutions</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-400 text-sm">© {new Date().getFullYear()} HireFlow. All rights reserved.</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
                </footer>
            </div>
        );
    }

    // Fallback - should never reach here due to useEffect redirect
    return null;
}
