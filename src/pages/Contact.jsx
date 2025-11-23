import { useState } from 'react';
import HeroSlider from '../components/HeroSlider';
import GalleryFooter from '../components/GalleryFooter';

const CONTACT_SLIDER_IMAGES = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'SLU Alumni Community',
    caption: 'Stay connected with the SLU community worldwide.',
  },
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Alumni Engagement',
    caption: 'Building lifelong connections through SLU.',
  },
  {
    src: '/assets/hero/campus img1.jpg',
    alt: 'SLU Campus',
    caption: 'Your SLU home, always here for you.',
  },
  {
    src: '/assets/hero/Alumni img1.jpg',
    alt: 'Alumni Network',
    caption: 'Join thousands of Billikens making a difference.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'Community',
    caption: 'Once a Billiken, Always a Billiken.',
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    organization: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
      const response = await fetch(`${API_BASE_URL}/api/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Your request has been submitted successfully. We will get back to you soon!' });
        // Clear form
        setFormData({
          name: '',
          email: '',
          role: '',
          organization: '',
          subject: '',
          message: '',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus({ type: 'error', message: errorData.error || 'Failed to submit your request. Please try again.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Slider */}
      <div className="container mx-auto px-4 pt-6">
        <div className="h-[450px] md:h-[550px]">
          <HeroSlider images={CONTACT_SLIDER_IMAGES} interval={5000}>
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                Connect with SLU
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl drop-shadow-lg">
                Reach out to Saint Louis University. We're here to help with your questions, requests, and connections.
              </p>
            </div>
          </HeroSlider>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column - Static SLU Information */}
          <div className="bg-gradient-to-br from-sluBlue to-blue-800 shadow-lg rounded-2xl p-6 text-white">
            <h2 className="text-2xl font-bold text-white mb-4">
              Saint Louis University
            </h2>
            
            {/* Historical Information */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Seeking Truth, Transforming Lives
              </h3>
              <p className="text-white/90 mb-4 leading-relaxed text-sm">
                Saint Louis University's history of educational excellence goes back more than 200 years. As the first university in the American West, we are proud of our home in St. Louis and of our Catholic, Jesuit mission.
              </p>
              <p className="text-white/90 mb-4 leading-relaxed text-sm">
                Our origins are humble. In November 1818, classes were offered to "young gentlemen" in a few rooms rented by newly arrived Bishop Louis DuBourg. Vincentian seminarians were studying theology nearby. A few years later, the Jesuits of the Missouri Mission began to run the school. And the rest, as they say, is history.
              </p>
              <a 
                href="https://www.slu.edu/timeline/index.php" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-white hover:text-sluGold transition-colors underline text-sm font-semibold"
              >
                Explore 200 Years of History →
              </a>
            </div>
            
            {/* About SLU Link */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Discover Your SLU Experience
              </h3>
              <p className="text-white/90 mb-4 leading-relaxed text-sm">
                Learn more about what makes Saint Louis University special. Discover our Jesuit tradition, campus life, academic programs, and the unique opportunities that await you at SLU.
              </p>
              <a 
                href="https://youatslu.slu.edu/about" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-white hover:text-sluGold transition-colors underline text-sm font-semibold"
              >
                Learn More About SLU →
              </a>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Address</h3>
                <p className="text-white/90 text-sm">
                  Saint Louis University<br />
                  1 N. Grand Blvd.<br />
                  St. Louis, MO 63103 USA
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Phone</h3>
                <p className="text-white/90 text-sm">
                  <a href="tel:1-800-758-3678" className="text-white hover:text-sluGold transition-colors underline">
                    1-800-758-3678 (SLU-FOR-U)
                  </a>
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Website</h3>
                <p className="text-white/90 text-sm">
                  <a 
                    href="https://www.slu.edu" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-sluGold transition-colors underline"
                  >
                    https://www.slu.edu
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Enquiry Form */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-sluBlue mb-6">
              Connect with SLU
            </h2>

            {/* Status Messages */}
            {status.type && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <p className="font-medium">{status.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent"
                >
                  <option value="">Select your role</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Employer">Employer</option>
                  <option value="Guest">Guest</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 mb-2">
                  Organization <span className="text-slate-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent"
                  placeholder="Your organization or company"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent"
                  placeholder="What is your request about?"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue focus:border-transparent resize-vertical"
                  placeholder="Please provide details about your request..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer Section */}
      <div className="container mx-auto px-4 py-8">
        <GalleryFooter />
      </div>
    </div>
  );
};

export default Contact;
