import { SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentSignup() {
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();

    // Set role in session storage for backend to pick up
    useEffect(() => {
        sessionStorage.setItem('signupRole', 'STUDENT');
    }, []);

    // Redirect if already signed in
    useEffect(() => {
        if (isSignedIn) {
            navigate('/student-dashboard');
        }
    }, [isSignedIn, navigate]);

    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - Promotional / Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 to-orange-700/80"></div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
                    <div className="text-3xl font-bold mb-4 flex items-center gap-2">
                        <span className="bg-white text-orange-900 p-1 rounded font-extrabold text-xl">HF</span> Hireflow
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Start Your Journey Today
                    </h1>
                    <p className="text-xl text-green-100 max-w-md mb-8">
                        Create your account and get access to AI-powered assessments, personalized job matches, and skill development resources.
                    </p>

                    <div className="space-y-4 text-orange-100">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">AI Resume Analysis</p>
                                <p className="text-sm">Get instant feedback on your skills and experience</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">Smart Job Matching</p>
                                <p className="text-sm">Find roles that match your unique skill set</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">Skill Gap Insights</p>
                                <p className="text-sm">Personalized learning recommendations</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-gray-900">Create Student Account</h2>
                        <p className="text-gray-500 mt-2">Join thousands of students getting hired based on skills.</p>
                    </div>

                    <div className="flex justify-center">
                        {!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? (
                            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 font-semibold mb-2">⚠️ Configuration Error</p>
                                <p className="text-red-600 text-sm">
                                    Clerk Publishable Key is missing. Please check your .env file.
                                </p>
                            </div>
                        ) : (
                            <SignUp
                                routing="virtual"
                                afterSignUpUrl="/student-dashboard"
                                signInUrl="/student-login"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "shadow-none border-none w-full p-0",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        formButtonPrimary: "bg-orange-600 hover:bg-orange-700 text-sm normal-case",
                                        socialButtonsBlockButton: "border-gray-300 text-gray-600 hover:bg-gray-50 text-sm normal-case",
                                        formFieldInput: "rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500",
                                        footerAction: "hidden"
                                    }
                                }}
                                fallback={
                                    <div className="text-center p-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                                        <p className="text-gray-600">Loading signup form...</p>
                                    </div>
                                }
                            />
                        )}
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <a href="/student-login" className="text-orange-600 font-bold hover:underline">Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
