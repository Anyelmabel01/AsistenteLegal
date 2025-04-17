import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ScaleIcon, UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Import icons

interface RegisterProps {
  onSwitchToLogin: () => void; // Function to switch to Login view
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName, // This will be available in the trigger
          }
        }
      });

      if (error) throw error;

      // Check if user needs email confirmation
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // This case might happen with phone auth or if email confirmation is disabled
        setMessage('Registro exitoso. Por favor inicia sesión.');
      } else if (data.user) {
        setMessage('Registro exitoso. Revisa tu email para confirmar tu cuenta.');
      } else {
        setMessage('Registro iniciado. Revisa tu email para el siguiente paso.');
      }

      // Clear form or redirect as needed
      // setEmail('');
      // setPassword('');
      // setFullName('');

    } catch (error: any) {
      console.error('Register error:', error.message);
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title - Changed logo color */}
        <div className="text-center">
           <ScaleIcon className="mx-auto h-16 w-auto text-gray-600" />
           <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">LEGAL ASSISTANT</h1>
           <p className="mt-2 text-lg text-gray-500">Create your account</p>
        </div>

        {error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {message && (
           <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
             <span className="block sm:inline">{message}</span>
           </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
            {/* Full Name Input */}
             <div className="relative">
               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                disabled={loading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pl-10 pr-3 bg-white text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50"
                placeholder="Full Name"
              />
           </div>

           {/* Email Input */}
            <div className="relative">
               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              <input
                id="emailReg"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pl-10 pr-3 bg-white text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50"
                placeholder="Email Address"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
               <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              <input
                id="passwordReg"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-3 pl-10 pr-3 bg-white text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50"
                placeholder="Password (min. 6 characters)"
              />
            </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
               {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Create Account
            </button>
          </div>
        </form>

        {/* Link to Login */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Already a member? {' '}
          <button onClick={onSwitchToLogin} className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register; 