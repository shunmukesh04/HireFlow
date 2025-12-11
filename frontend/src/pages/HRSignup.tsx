import { SignUp } from "@clerk/clerk-react";
import { useEffect } from "react";

export default function HRSignup() {
    // Set role in session storage for backend to pick up
    useEffect(() => {
        sessionStorage.setItem('signupRole', 'HR');
    }, []);

    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - HR Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-blue-700/85"></div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
                    <div className="text-3xl font-bold mb-4 flex items-center gap-2">
                        <span className="bg-white text-blue-900 p-1 rounded font-extrabold text-xl">HF</span> Hireflow
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Transform Your Recruitment
                    </h1>
                    <p className="text-xl text-blue-100 max-w-md mb-8">
                        Join leading companies using AI-powered hiring to find the best talent faster.
                    </p>

                    <div className="space-y-4 text-blue-100">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">AI-Powered Screening</p>
                                <p className="text-sm">Automatically rank candidates by fit score</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">Custom Assessments</p>
                                <p className="text-sm">Create MCQ and coding tests tailored to your needs</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold text-white">Talent Pool Management</p>
                                <p className="text-sm">Save high-potential candidates for future opportunities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-gray-900">Create HR Account</h2>
                        <p className="text-gray-500 mt-2">Start hiring smarter with AI-powered tools</p>
                    </div>

                    <div className="flex justify-center">
                        <SignUp
                            afterSignUpUrl="/hr-dashboard"
                            signInUrl="/hr-login"
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-none border-none w-full p-0",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                                    socialButtonsBlockButton: "border-gray-300 text-gray-600 hover:bg-gray-50 text-sm normal-case",
                                    formFieldInput: "rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                    footerAction: "hidden"
                                }
                            }}
                        />
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account? <a href="/hr-login" className="text-blue-600 font-bold hover:underline">Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
