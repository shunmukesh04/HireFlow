import { SignIn } from "@clerk/clerk-react";

export default function StudentLogin() {
    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - Promotional / Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                }}
            >
                <div className="absolute inset-0 bg-blue-900/80"></div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white h-full">
                    <div className="text-3xl font-bold mb-4 flex items-center gap-2">
                        <span className="bg-white text-blue-900 p-1 rounded font-extrabold text-xl">HF</span> Hireflow
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Unlock Your Career Potential
                    </h1>
                    <p className="text-xl text-blue-100 max-w-md">
                        Join thousands of students getting hired based on skills, not just resumes. AI-powered assessments tailored for you.
                    </p>

                    <div className="mt-12 flex gap-6 text-sm text-blue-200">
                        <span>Trusted By:</span>
                        <div className="flex gap-4 font-bold text-white opacity-80">
                            <span>Google</span>
                            <span>Microsoft</span>
                            <span>Amazon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-gray-900">Student Login</h2>
                        <p className="text-gray-500 mt-2">Welcome back! Please login to your account.</p>
                    </div>

                    <div className="flex justify-center">
                        <SignIn
                            afterSignInUrl="/student-dashboard"
                            signUpUrl="/sign-up"
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
                        Don't have an account? <a href="/sign-up" className="text-blue-600 font-bold hover:underline">Sign up</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
