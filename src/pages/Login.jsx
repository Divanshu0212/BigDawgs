import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase'; // Ensure this path matches your Firebase config
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home'); // Redirect to home if user is already authenticated
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [navigate]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Store user info in localStorage if needed
      localStorage.setItem(
        'user',
        JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        })
      );

      navigate('/home'); // Redirect after successful login
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account exists with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        default:
          setError('Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1c1c1c] min-h-screen flex flex-col">
      <div className="flex items-center justify-center flex-grow">
        <div className="relative bg-gradient-to-b from-[#32CD32] to-[#2ECC71] p-8 w-[600px] box-border shadow-lg before:absolute before:top-0 before:right-0 before:w-0 before:h-0 before:border-l-[40px] before:border-t-[40px] before:border-l-transparent before:border-t-[#1c1c1c]">
          <h1 className="text-2xl mb-8 text-white font-bold text-shadow text-left">
            ENTER THE ARENA
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center mb-6">
              <label htmlFor="email" className="w-24 text-white text-lg">
                Email:
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter Email"
                name="email"
                value={data.email}
                onChange={handleOnChange}
                className="flex-1 bg-gray-800 p-2 rounded text-gray-200 ml-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center mb-6">
              <label htmlFor="password" className="w-24 text-white text-lg">
                Password:
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter Password"
                value={data.password}
                name="password"
                onChange={handleOnChange}
                className="flex-1 bg-gray-800 p-2 rounded text-gray-200 ml-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={loading}
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-1/3 p-2 rounded transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                }`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
