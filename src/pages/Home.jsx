import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadAllData } from '../data/loadData';

const Home = () => {
  const [data, setData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideData, setSlideData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const loadedData = await loadAllData();
      setData(loadedData);
      
      // Prepare slide data with alumni and employer information
      if (loadedData && loadedData.students && loadedData.employers && loadedData.alumniEngagement) {
        const slides = [];
        
        // Get top employers
        const employerHires = {};
        loadedData.alumniEngagement.forEach(e => {
          if (e.hired_flag === '1' || e.hired_flag === 1) {
            const employer = loadedData.employers.find(emp => emp.employer_key === e.employer_key);
            if (employer) {
              employerHires[employer.employer_key] = (employerHires[employer.employer_key] || 0) + 1;
            }
          }
        });
        
        const topEmployers = Object.entries(employerHires)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([key, hires]) => {
            const employer = loadedData.employers.find(e => e.employer_key === key);
            return { ...employer, hires };
          });
        
        // Get featured alumni (students with high engagement)
        const alumniEngagement = loadedData.alumniEngagement
          .map(e => {
            const student = loadedData.students.find(s => s.student_key === e.student_key);
            return { ...e, student };
          })
          .filter(e => e.student)
          .sort((a, b) => parseFloat(b.engagement_score || 0) - parseFloat(a.engagement_score || 0))
          .slice(0, 5);
        
        // Combine alumni and employers for slides
        topEmployers.forEach((employer, idx) => {
          if (employer) {
            slides.push({
              type: 'employer',
              name: employer.employer_name || 'Employer',
              industry: employer.industry || 'Technology',
              location: `${employer.hq_city || ''}, ${employer.hq_state || ''}`.trim(),
              hires: employer.hires || 0,
              description: `${employer.employer_name} is a leading ${employer.industry || 'company'} with ${employer.hires || 0} hires from SLU.`,
              image: `https://ui-avatars.com/api/?name=${encodeURIComponent(employer.employer_name || 'Employer')}&background=002F6C&color=fff&size=200`
            });
          }
        });
        
        alumniEngagement.forEach((item, idx) => {
          if (item.student) {
            slides.push({
              type: 'alumni',
              name: `${item.student.first_name || ''} ${item.student.last_name || ''}`.trim() || 'Alumni',
              program: item.student.program_name || 'Graduate Program',
              role: item.job_role || 'Professional',
              engagement: parseFloat(item.engagement_score || 0).toFixed(1),
              description: `${item.student.first_name || 'Alumni'} graduated from ${item.student.program_name || 'SLU'} and is now working as a ${item.job_role || 'professional'}.`,
              image: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student.first_name + ' ' + item.student.last_name || 'Alumni')}&background=FDB515&color=002F6C&size=200`
            });
          }
        });
        
        setSlideData(slides);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (slideData.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slideData.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [slideData.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideData.length) % slideData.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sluBlue to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Saint Louis University</h1>
          <p className="text-2xl mb-8">DataNexus Dashboard</p>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Connecting Alumni, Employers, and Opportunities
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/alumni"
              className="bg-sluGold text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              View Alumni Dashboard
            </Link>
            <Link
              to="/employer"
              className="bg-white text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Employer Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Vision and Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-sluGold">
            <h2 className="text-3xl font-bold text-sluBlue mb-4">Our Vision</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              To be a globally recognized leader in higher education, where innovation meets tradition, 
              and where students, alumni, and employers come together to create lasting impact. We envision 
              a community where every graduate finds meaningful employment, every employer discovers exceptional 
              talent, and every connection strengthens our shared mission of excellence.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-sluBlue">
            <h2 className="text-3xl font-bold text-sluBlue mb-4">Our Mission</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Saint Louis University is committed to the pursuit of truth and the transmission of knowledge 
              for the betterment of society. Through our DataNexus platform, we strive to foster strong 
              connections between our talented alumni, forward-thinking employers, and the broader community. 
              We empower our graduates with opportunities and provide employers with exceptional talent.
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluGold">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set(data.students.map(s => s.student_key)).size}
              </div>
              <div className="text-gray-600 font-semibold">Alumni</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluBlue">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set(data.employers.map(e => e.employer_key)).size}
              </div>
              <div className="text-gray-600 font-semibold">Employers</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluGold">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {data.alumniEngagement.filter(e => e.hired_flag === '1' || e.hired_flag === 1).length}
              </div>
              <div className="text-gray-600 font-semibold">Total Hires</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluBlue">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set(data.events.map(e => e.event_key)).size}
              </div>
              <div className="text-gray-600 font-semibold">Events</div>
            </div>
          </div>
        )}

        {/* Alumni and Employers Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-sluBlue mb-4 flex items-center">
              <span className="mr-3">🎓</span> Our Alumni
            </h2>
            <p className="text-gray-700 mb-4">
              Our alumni network is a testament to SLU's commitment to excellence. With graduates excelling 
              in various fields including data science, artificial intelligence, cybersecurity, and business 
              analytics, our alumni are making significant contributions to their industries.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Diverse programs across technology and business</li>
              <li>Strong engagement in professional development</li>
              <li>Active participation in networking events</li>
              <li>High placement rates in leading organizations</li>
            </ul>
            <Link
              to="/alumni"
              className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explore Alumni Dashboard →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-sluBlue mb-4 flex items-center">
              <span className="mr-3">💼</span> Our Employers
            </h2>
            <p className="text-gray-700 mb-4">
              We partner with leading employers across industries who value the talent and skills that SLU 
              graduates bring. Our employer network spans healthcare, finance, technology, retail, and many 
              other sectors, providing diverse opportunities for our alumni.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Partnerships with industry leaders</li>
              <li>Diverse opportunities across sectors</li>
              <li>Strong hiring relationships</li>
              <li>Continuous engagement programs</li>
            </ul>
            <Link
              to="/employer"
              className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explore Employer Dashboard →
            </Link>
          </div>
        </div>

        {/* Slider Section */}
        {slideData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-sluBlue mb-8 text-center">
              Featured Alumni & Employers
            </h2>
            <div className="relative">
              {/* Slide Container */}
              <div className="overflow-hidden rounded-lg">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slideData.map((slide, index) => (
                    <div
                      key={index}
                      className="min-w-full flex-shrink-0"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6">
                        <div className="text-center">
                          <img
                            src={slide.image}
                            alt={slide.name}
                            className="w-48 h-48 rounded-full mx-auto mb-4 border-4 border-sluGold shadow-lg"
                          />
                          <h3 className="text-2xl font-bold text-sluBlue mb-2">{slide.name}</h3>
                          {slide.type === 'alumni' ? (
                            <>
                              <p className="text-gray-600 mb-1">{slide.program}</p>
                              <p className="text-gray-700 font-semibold">{slide.role}</p>
                              <p className="text-sluGold mt-2">Engagement Score: {slide.engagement}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-600 mb-1">{slide.industry}</p>
                              <p className="text-gray-700 mb-1">{slide.location}</p>
                              <p className="text-sluGold font-semibold mt-2">{slide.hires} Hires from SLU</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center">
                          <p className="text-gray-700 text-lg leading-relaxed">{slide.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-sluBlue text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-sluBlue text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                aria-label="Next slide"
              >
                →
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {slideData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-3 rounded-full transition-all ${
                      index === currentSlide
                        ? 'bg-sluGold w-8'
                        : 'bg-gray-300 w-3 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-sluBlue to-blue-800 rounded-lg shadow-lg p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Dive into detailed analytics and insights about our alumni network and employer partnerships. 
            Discover trends, patterns, and opportunities that drive success.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/alumni"
              className="bg-sluGold text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Alumni Dashboard
            </Link>
            <Link
              to="/employer"
              className="bg-white text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Employer Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
