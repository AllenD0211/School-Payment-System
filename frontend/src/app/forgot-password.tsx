import { useState } from "react";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with your backend API call to send reset email
    setMessage(
      `If an account exists for ${email}, a password reset link has been sent.`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F2854] p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Forgot Password</h1>
        <p className="text-sm text-[#BDE8F5] mb-6">
          Enter your email address below and we’ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 text-sm">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#BDE8F5]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#4988C4] hover:bg-[#3672A3] text-white font-semibold py-3 rounded-lg transition"
          >
            Send Reset Link
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-[#BDE8F5]">{message}</p>
        )}

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-[#BDE8F5] hover:underline text-sm"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
