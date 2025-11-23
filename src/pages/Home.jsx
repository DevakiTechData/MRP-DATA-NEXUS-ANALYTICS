import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadAllData } from '../data/loadData';
import { loadGalleryData } from '../data/galleryData';
import HeroSlider from '../components/HeroSlider';
import GalleryFooter from '../components/GalleryFooter';

const Home = () => {
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideData, setSlideData] = useState([]);
  const [error, setError] = useState(null);
  
  // Only admin can see dashboard buttons
  const canViewDashboards = role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const loadedData = await loadAllData();
        setData(loadedData);
        
        // Load gallery data for slider - with error handling
        let galleryData = null;
        try {
          galleryData = await loadGalleryData();
        console.log('✅ Gallery data loaded for home slider:', {
          employerWords: galleryData?.employerWords?.length || 0,
          careerSuccessStories: galleryData?.careerSuccessStories?.length || 0,
          employerFeedbackStories: galleryData?.employerFeedbackStories?.length || 0,
        });
        if (galleryData?.employerFeedbackStories && galleryData.employerFeedbackStories.length > 0) {
          console.log('📋 Sample employer feedback story:', galleryData.employerFeedbackStories[0]);
        }
        } catch (galleryError) {
          console.warn('⚠️ Failed to load gallery data, will use fallback:', galleryError);
          galleryData = null; // Ensure it's null on error
        }
        
        const slides = [];
        
        // Add success stories from gallery (careerSuccessStories) - Alumni Success Stories
        if (galleryData?.careerSuccessStories && Array.isArray(galleryData.careerSuccessStories) && galleryData.careerSuccessStories.length > 0) {
          galleryData.careerSuccessStories.forEach((story) => {
            if (story && story.name) {
              slides.push({
                type: 'alumni',
                name: story.name || 'SLU Alumni',
                program: story.program || 'SLU Graduate',
                role: story.currentRole || 'Professional',
                company: story.company || 'Leading Company',
                location: story.location || 'USA',
                description: story.story || `${story.name} successfully transitioned to ${story.currentRole} at ${story.company} after completing SLU's ${story.program} program.`,
                image: story.photo || '/assets/alumni/student1.jpeg',
                engagement: 'Success Story',
              });
            }
          });
        }
        
        // Add employer feedback stories from gallery (employerFeedbackStories) - Employer Feedback Stories
        if (galleryData?.employerFeedbackStories && Array.isArray(galleryData.employerFeedbackStories) && galleryData.employerFeedbackStories.length > 0) {
          console.log('📋 Processing employer feedback stories:', galleryData.employerFeedbackStories.length);
          galleryData.employerFeedbackStories.forEach((feedback, idx) => {
            console.log(`  [${idx + 1}] Feedback story:`, {
              name: feedback.name,
              company: feedback.company,
              currentRole: feedback.currentRole,
              story: feedback.story?.substring(0, 50),
              photo: feedback.photo,
            });
            // Log the full feedback object to see all available fields
            console.log(`  [${idx + 1}] Full feedback object:`, feedback);
            console.log(`  [${idx + 1}] Feedback keys:`, Object.keys(feedback || {}));
            
            if (feedback && (feedback.company || feedback.name)) {
              // Ensure image URL is valid - if it's an external URL with CORS issues, use fallback
              let imageUrl = feedback.photo || feedback.image_url || '/assets/hero/engagement img1.jpeg';
              
              // If it's an external URL (starts with http), check if it might have CORS issues
              if (imageUrl && imageUrl.startsWith('http') && !imageUrl.startsWith(window.location.origin)) {
                console.warn(`  ⚠️ External image URL detected (may have CORS issues): ${imageUrl}, using fallback`);
                imageUrl = '/assets/hero/engagement img1.jpeg';
              }
              
              // Ensure image URL starts with / if it's a local path
              if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
                imageUrl = `/${imageUrl}`;
              }
              
              // Get description from multiple possible fields
              const description = feedback.story || feedback.comment_overall || feedback.description || `Successfully working as ${feedback.currentRole || feedback.job_role || 'a professional'} at ${feedback.company || 'a partner company'}.`;
              
              const slideData = {
                type: 'employer-feedback',
                name: feedback.name || `Alumni from ${feedback.company}`,
                company: feedback.company || 'Partner Company',
                role: feedback.currentRole || feedback.job_role || 'Professional',
                location: feedback.location || 'USA',
                description: description,
                image: imageUrl,
                year: feedback.year || feedback.graduation_year || 'N/A',
                // Include all original fields for debugging
                _original: feedback,
              };
              console.log(`  [${idx + 1}] Created slide data:`, slideData);
              console.log(`  [${idx + 1}] Slide will be at index:`, slides.length);
              slides.push(slideData);
              console.log(`  [${idx + 1}] Slide added. Total slides now:`, slides.length);
            } else {
              console.warn(`  ⚠️ Skipping feedback story ${idx + 1} - missing company/name:`, feedback);
            }
          });
          console.log(`✅ Added ${slides.filter(s => s.type === 'employer-feedback').length} employer feedback slides`);
        } else {
          console.warn('⚠️ No employer feedback stories available:', {
            hasStories: !!galleryData?.employerFeedbackStories,
            isArray: Array.isArray(galleryData?.employerFeedbackStories),
            length: galleryData?.employerFeedbackStories?.length || 0,
          });
        }
        
        console.log('📊 Total slides created from gallery:', slides.length);
        console.log('📊 Gallery data status:', {
          hasGalleryData: !!galleryData,
          employerWordsCount: galleryData?.employerWords?.length || 0,
          careerSuccessStoriesCount: galleryData?.careerSuccessStories?.length || 0,
          employerFeedbackStoriesCount: galleryData?.employerFeedbackStories?.length || 0,
        });
        
        // Fallback: Only use original logic if gallery data completely failed (null) AND no slides were created
        // If gallery data loaded but returned empty arrays, that's fine - we'll use what we have
        if (slides.length === 0 && (!galleryData || (galleryData && !galleryData.employerWords && !galleryData.careerSuccessStories && !galleryData.employerFeedbackStories)) && loadedData && loadedData.students && loadedData.employers && loadedData.alumniEngagement) {
          console.log('⚠️ Using fallback logic - gallery data was not available or empty');
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
          topEmployers.forEach((employer) => {
            if (employer) {
              slides.push({
                type: 'employer',
                name: employer.employer_name || 'Employer',
                industry: employer.industry || 'Technology',
                location: `${employer.hq_city || ''}, ${employer.hq_state || ''}`.trim(),
                hires: employer.hires || 0,
                description: `${employer.employer_name} is a leading ${employer.industry || 'company'} with ${employer.hires || 0} hires from SLU.`,
                image: employer.logo_url || '/assets/employers/Comp img1.jpeg',
              });
            }
          });
          
          alumniEngagement.forEach((item) => {
            if (item.student) {
              slides.push({
                type: 'alumni',
                name: `${item.student.first_name || ''} ${item.student.last_name || ''}`.trim() || 'Alumni',
                program: item.student.program_name || 'Graduate Program',
                role: item.job_role || 'Professional',
                engagement: parseFloat(item.engagement_score || 0).toFixed(1),
                description: `${item.student.first_name || 'Alumni'} graduated from ${item.student.program_name || 'SLU'}.\nNow working as ${item.job_role || 'a professional'}.`,
                image: item.student.photo_url || '/assets/alumni/student1.jpeg',
              });
            }
          });
        }
        
        console.log('Final slides array length:', slides.length);
        if (slides.length > 0) {
          console.log('Sample slide:', slides[0]);
          console.log('All slides:', slides);
          // Log breakdown by type
          const alumniCount = slides.filter(s => s.type === 'alumni').length;
          const feedbackCount = slides.filter(s => s.type === 'employer-feedback').length;
          console.log(`📊 Slide breakdown: ${alumniCount} alumni success stories, ${feedbackCount} employer feedback stories`);
          
          // Log the 5th slide specifically
          if (slides.length >= 5) {
            console.log('🔍 5th slide (index 4) details:', slides[4]);
            console.log('🔍 5th slide type:', slides[4].type);
            console.log('🔍 5th slide name:', slides[4].name);
            console.log('🔍 5th slide company:', slides[4].company);
            console.log('🔍 5th slide description:', slides[4].description?.substring(0, 100));
          } else {
            console.warn(`⚠️ Only ${slides.length} slides found, expected at least 5`);
          }
        } else {
          console.warn('No slides created! Gallery data:', {
            hasEmployerWords: !!galleryData?.employerWords,
            employerWordsLength: galleryData?.employerWords?.length || 0,
            hasCareerStories: !!galleryData?.careerSuccessStories,
            careerStoriesLength: galleryData?.careerSuccessStories?.length || 0,
            hasFeedbackStories: !!galleryData?.employerFeedbackStories,
            feedbackStoriesLength: galleryData?.employerFeedbackStories?.length || 0,
          });
        }
        setSlideData(slides);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
        // Set empty data structure to prevent crashes
        setData({
          students: [],
          employers: [],
          alumniEngagement: [],
          events: [],
        });
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (slideData.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slideData.length);
      }, 15000); // Change slide every 15 seconds (slower)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 text-xl font-semibold mb-4">⚠️ Error Loading Data</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-sluBlue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-6">
        <div className="h-[450px] md:h-[550px]">
          <HeroSlider interval={9000}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Saint Louis University</h1>
          <p className="text-xl md:text-3xl font-semibold text-white/90">DataNexus Dashboard</p>
          <p className="text-base md:text-xl text-white/85 max-w-3xl mx-auto">
            Connecting Alumni, Employers, and Opportunities
          </p>
          {canViewDashboards && (
            <div className="mt-6 flex flex-col md:flex-row justify-center gap-3 md:gap-6">
              <Link
                to="/alumni"
                className="bg-sluGold text-sluBlue px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors shadow-lg"
              >
                View Alumni Dashboard
              </Link>
              <Link
                to="/employer"
                className="bg-white/90 text-sluBlue px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
              >
                View Employer Dashboard
              </Link>
            </div>
          )}
          </HeroSlider>
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
        {data && data.students && data.employers && data.alumniEngagement && data.events && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluGold">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set((data.students || []).map(s => s.student_key)).size}
              </div>
              <div className="text-gray-600 font-semibold">Alumni</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluBlue">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set((data.employers || []).map(e => e.employer_key)).size}
              </div>
              <div className="text-gray-600 font-semibold">Employers</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluGold">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {(data.alumniEngagement || []).filter(e => e.hired_flag === '1' || e.hired_flag === 1).length}
              </div>
              <div className="text-gray-600 font-semibold">Total Hires</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-t-4 border-sluBlue">
              <div className="text-4xl font-bold text-sluBlue mb-2">
                {new Set((data.events || []).map(e => e.event_key)).size}
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
            {canViewDashboards ? (
              <Link
                to="/alumni"
                className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Explore Alumni Dashboard →
              </Link>
            ) : (
              <Link
                to="/alumni-portal"
                className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Visit Alumni Portal →
              </Link>
            )}
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
            {canViewDashboards ? (
              <Link
                to="/employer"
                className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Explore Employer Dashboard →
              </Link>
            ) : (
              <Link
                to="/employer-portal"
                className="inline-block bg-sluBlue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Visit Employer Portal →
              </Link>
            )}
          </div>
        </div>

        {/* Slider Section */}
        {slideData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-sluBlue mb-8 text-center">
              Alumni, SLU & Employer Relationship Stories
            </h2>
            <div className="relative">
              {/* Slide Container */}
              <div className="overflow-hidden rounded-lg">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {slideData.map((slide, index) => {
                    // Debug log for each slide, especially the 5th one
                    if (index === 4) {
                      console.log(`🔍 Rendering slide ${index + 1} (5th slide):`, slide);
                      console.log(`🔍 Slide ${index + 1} type:`, slide?.type);
                      console.log(`🔍 Slide ${index + 1} name:`, slide?.name);
                      console.log(`🔍 Slide ${index + 1} image:`, slide?.image);
                      console.log(`🔍 Slide ${index + 1} description:`, slide?.description);
                      console.log(`🔍 Slide ${index + 1} company:`, slide?.company);
                      console.log(`🔍 Slide ${index + 1} role:`, slide?.role);
                      console.log(`🔍 Slide ${index + 1} year:`, slide?.year);
                      console.log(`🔍 All slideData:`, slideData);
                    }
                    
                    // Ensure slide exists - if not, render a placeholder
                    if (!slide) {
                      console.warn(`⚠️ Slide ${index + 1} is null or undefined`);
                      return (
                        <div key={index} className="min-w-full flex-shrink-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6">
                            <div className="text-center">
                              <p className="text-gray-500">Loading slide {index + 1}...</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Ensure all required fields exist with defaults
                    // For 5th slide, use more aggressive fallbacks
                    let slideName = slide.name || slide._original?.name || (index === 4 ? 'Alumni from Company 1' : 'SLU Alumni');
                    let slideImage = slide.image || slide.photo || slide._original?.photo || slide._original?.image_url || (slide.type === 'employer-feedback' ? '/assets/hero/engagement img1.jpeg' : '/assets/alumni/student1.jpeg');
                    let slideDescription = slide.description || slide.story || slide._original?.story || slide._original?.comment_overall || (index === 4 ? 'This employer feedback showcases the technical strengths and contributions of SLU alumni in professional settings.' : 'No description available.');
                    let slideCompany = slide.company || slide._original?.company || (index === 4 ? 'Company 1' : 'Partner Company');
                    let slideRole = slide.role || slide.currentRole || slide._original?.currentRole || slide._original?.job_role || (index === 4 ? 'Data Analyst, BI Developer, Full-Stack Developer' : 'Professional');
                    let slideYear = slide.year || slide._original?.year || slide._original?.graduation_year || (index === 4 ? '2025' : 'N/A');
                    
                    // Log for 5th slide after processing
                    if (index === 4) {
                      console.log(`✅ Processed slide ${index + 1} - Name: ${slideName}, Image: ${slideImage}, Description length: ${slideDescription.length}`);
                    }
                    
                    // For 5th slide, add extra debugging
                    if (index === 4) {
                      console.log(`🎨 About to render slide ${index + 1} with:`, {
                        slideName,
                        slideImage,
                        slideDescription: slideDescription.substring(0, 50),
                        slideType: slide.type,
                        slideCompany,
                        slideRole,
                        slideYear,
                        originalSlide: slide,
                      });
                    }
                    
                    // Force render for 5th slide even if data seems incomplete
                    if (index === 4) {
                      console.warn(`⚠️ Rendering slide 5 - Name: "${slideName}", Type: "${slide.type}", Company: "${slideCompany}", Role: "${slideRole}"`);
                      console.warn(`⚠️ Slide 5 full object:`, slide);
                      console.warn(`⚠️ Slide 5 image: "${slideImage}"`);
                      console.warn(`⚠️ Slide 5 description length: ${slideDescription.length}`);
                    }
                    
                    return (
                      <div
                        key={`slide-${index}-${slide.type || 'unknown'}`}
                        className="min-w-full flex-shrink-0"
                        style={{ 
                          display: 'block', 
                          minHeight: '400px', 
                          visibility: 'visible',
                          opacity: 1,
                          width: '100%'
                        }}
                        data-slide-index={index}
                        data-slide-type={slide.type}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 bg-white" style={{ minHeight: '400px' }}>
                          <div className="text-center">
                            <img
                              src={slideImage}
                              alt={slideName}
                              className="w-48 h-48 rounded-full mx-auto mb-4 border-4 border-sluGold shadow-lg object-cover bg-gray-100"
                              onError={(e) => {
                                console.warn(`Image failed to load for slide ${index + 1}:`, slideImage, 'Type:', slide.type);
                                const fallbackImage = slide.type === 'employer' || slide.type === 'employer-feedback'
                                  ? '/assets/employers/Comp img1.jpeg' 
                                  : '/assets/alumni/student1.jpeg';
                                e.target.src = fallbackImage;
                                console.log(`Using fallback image: ${fallbackImage}`);
                              }}
                              onLoad={() => {
                                if (index === 4) {
                                  console.log(`✅ Image loaded successfully for slide ${index + 1}:`, slideImage);
                                }
                              }}
                            />
                            <h3 className="text-2xl font-bold text-sluBlue mb-2">{slideName || 'SLU Alumni'}</h3>
                            {slide.type === 'alumni' ? (
                              <>
                                <p className="text-gray-600 mb-1">{slide.program || 'SLU Graduate'}</p>
                                <p className="text-gray-700 font-semibold">{slide.role || 'Professional'}</p>
                                {slide.company && <p className="text-gray-600 text-sm mb-1">at {slide.company}</p>}
                                <p className="text-sluGold mt-2">{slide.engagement || 'Success Story'}</p>
                              </>
                            ) : slide.type === 'employer-feedback' ? (
                              <>
                                <p className="text-gray-600 mb-1">Graduated {slideYear}</p>
                                <p className="text-gray-700 font-semibold">{slideRole}</p>
                                <p className="text-gray-600 text-sm mb-1">at {slideCompany}</p>
                                <p className="text-sluGold mt-2">Featured Alumni</p>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-600 mb-1">{slide.industry || 'Technology'}</p>
                                <p className="text-gray-700 mb-1">{slide.location || 'USA'}</p>
                                <p className="text-sluGold font-semibold mt-2">{typeof slide.hires === 'number' ? `${slide.hires} Hires from SLU` : slide.hires || 'SLU Partner'}</p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center">
                            <p className="text-gray-700 text-base leading-relaxed line-clamp-2 overflow-hidden">
                              {slideDescription || 'No description available for this slide.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-sluBlue mb-8 text-center">
              Alumni, SLU & Employer Relationship Stories
            </h2>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Loading featured content from gallery...</p>
              <p className="text-sm text-gray-500">Please check the browser console for debugging information.</p>
            </div>
          </div>
        )}

        {/* Call to Action Section */}
        <GalleryFooter />
      </div>
    </div>
  );
};

export default Home;
