import React, { useState } from 'react';
import { auth, storage } from '../firebase/firebase'; // Make sure to import storage if you've set it up
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    profilePic: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setData((prev) => ({ ...prev, profilePic: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!data.name?.trim()) {
      setError('Name is required');
      return false;
    }
    if (!data.email?.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(data.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (data.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Upload profile picture if exists
      let photoURL = '';
      if (data.profilePic) {
        const storageRef = ref(storage, `profile-pics/${userCredential.user.uid}`);
        const response = await fetch(data.profilePic);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: data.name,
        photoURL: photoURL
      });

      // Store user info in localStorage if needed
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: data.name,
        photoURL: photoURL
      }));

      navigate('/login');
    } catch (err) {
      // Handle specific Firebase errors
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already exists');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of your JSX remains the same
  return (
    <section className="bg-[#1c1c1c] min-h-screen flex flex-col justify-center items-center px-4 py-8">
      <div className="relative gradient-bg p-8 w-full md:w-2/3 lg:w-1/2 xl:w-1/2 rounded-lg shadow-lg">
        <h1 className="text-2xl text-[#138d1b] mb-8 text-left font-bold text-shadow">LET'S GET STARTED</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded text-center">
            {error}
          </div>
        )}

        <div className="photo-box relative w-24 h-24 rounded-full bg-gray-800 mx-auto mb-6 overflow-hidden flex justify-center items-center">
          <img
            id="profile-pic"
            src={data.profilePic || '/placeholder-profile.png'}
            className="w-full h-full object-cover absolute top-0 left-0 z-1"
          />
          <div className="absolute flex justify-center text-[#138d1b] items-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">
            Profile Picture
          </div>
          <input
            type="file"
            id="photo-upload"
            name="photo"
            accept="image/*"
            onChange={handleUploadPic}
            className="absolute w-full h-full opacity-0 cursor-pointer z-2"
            disabled={loading}
          />
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row items-center">
            <label htmlFor="username" className="w-full pr-2 sm:w-24 text-left sm:text-right text-gray-300 mb-2 sm:mb-0">
              Name:
            </label>
            <input
              type="text"
              id="username"
              name="name"
              value={data.name}
              onChange={handleOnChange}
              placeholder="Enter Name"
              required
              disabled={loading}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ADC35] sm:ml-2"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center">
            <label htmlFor="email" className="w-full pr-2 sm:w-24 text-left sm:text-right text-gray-300 mb-2 sm:mb-0">
              Email:
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              name="email"
              value={data.email}
              onChange={handleOnChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ADC35] sm:ml-2"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center">
            <label htmlFor="password" className="w-full pr-2 sm:w-24 text-left sm:text-right text-gray-300 mb-2 sm:mb-0">
              Password:
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              value={data.password}
              name="password"
              onChange={handleOnChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ADC35] sm:ml-2"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center">
            <label htmlFor="confirm_password" className="w-full pr-2 sm:w-24 text-left sm:text-right text-gray-300 mb-2 sm:mb-0">
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirm_password"
              placeholder="Enter confirm password"
              value={data.confirmPassword}
              name="confirmPassword"
              onChange={handleOnChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2ADC35] sm:ml-2"
            />
          </div>

          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-md text-white font-semibold transition duration-200
                ${loading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-[#2ADC35] hover:bg-[#138d1b]'
                }`}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignUp;