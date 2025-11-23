import { useEffect, useState } from 'react';
import HeroSlider from '../components/HeroSlider';
import GalleryHoverTooltip from '../components/GalleryHoverTooltip';
import GalleryFooter from '../components/GalleryFooter';
import { gallerySliderImages, loadGalleryData } from '../data/galleryData';

const GalleryPage = () => {
  const [data, setData] = useState({
    employerWords: [],
    alumniNetworking: [],
    careerSuccessStories: [],
    employerFeedbackStories: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const galleryData = await loadGalleryData();
        console.log('Gallery data loaded:', {
          careerSuccessStories: galleryData.careerSuccessStories?.length || 0,
          employerFeedbackStories: galleryData.employerFeedbackStories?.length || 0,
        });
        setData(galleryData);
      } catch (error) {
        console.error('Failed to load gallery data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sluBlue mb-4"></div>
          <p className="text-slate-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Slider Section */}
      <div className="container mx-auto px-4 pt-6">
        <div className="h-[450px] md:h-[550px]">
          <HeroSlider images={gallerySliderImages} interval={5000}>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                Saint Louis University Alumni
              </h1>
              <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-lg">
                Once a Billiken, Always a Billiken. Celebrating connections, achievements, and partnerships that shape the SLU community.
              </p>
            </div>
          </HeroSlider>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 md:pt-16 pb-16 space-y-20">
        {/* Section 1: Employer Words */}
        <section className="scroll-mt-20 bg-gradient-to-br from-slate-900 via-sluBlue to-blue-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              SLU Partnership Employers
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Leading employers who partner with SLU share their experiences and insights about our talent and collaborative relationships
            </p>
          </div>
          {data.employerWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.employerWords.map((testimonial) => (
                <GalleryHoverTooltip key={testimonial.id} data={testimonial} type="employer">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 p-8 relative overflow-hidden group cursor-pointer">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sluGold to-sluBlue" />
                    <div className="flex items-start gap-6 mb-6">
                      <div
                        className="w-20 h-20 rounded-xl bg-slate-100 bg-cover bg-center flex-shrink-0 shadow-md"
                        style={{ backgroundImage: `url(${testimonial.logo})` }}
                        onError={(e) => {
                          e.target.style.backgroundImage = `url(/assets/employers/Comp img1.jpeg)`;
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{testimonial.name}</h3>
                        <p className="text-sm text-white/80 mb-1">{testimonial.role}</p>
                        <p className="text-sm font-semibold text-sluGold">{testimonial.company}</p>
                      </div>
                    </div>
                    <blockquote className="relative">
                      <div className="absolute -top-2 -left-2 text-6xl text-white/10 font-serif leading-none">
                        &ldquo;
                      </div>
                      <p className="text-white/90 leading-relaxed relative z-10 pl-6 italic">
                        {testimonial.quote}
                      </p>
                    </blockquote>
                  </div>
                </GalleryHoverTooltip>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/10 rounded-2xl">
              <p className="text-white/80">No employer testimonials available at this time.</p>
            </div>
          )}
        </section>

        {/* Section 2: Alumni Networking */}
        <section className="scroll-mt-20 bg-gradient-to-br from-slate-900 via-sluBlue to-blue-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Alumni Networking
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Building lifelong connections through mentorship, events, and regional chapters
            </p>
          </div>
          {data.alumniNetworking.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.alumniNetworking.map((event) => (
                <GalleryHoverTooltip key={event.id} data={event} type="event">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden group cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = '/assets/hero/engagement img1.jpeg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full bg-sluGold text-slate-900 text-xs font-bold shadow-lg">
                          {event.type}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4">
                        <p className="text-white text-sm font-medium">{event.participants}</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                        <span className="text-xs text-white/80 font-medium">{event.date}</span>
                      </div>
                      <p className="text-white/90 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </GalleryHoverTooltip>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/10 rounded-2xl">
              <p className="text-white/80">No networking events available at this time.</p>
            </div>
          )}
        </section>

        {/* Section 3: Alumni Career Success Stories */}
        <section className="scroll-mt-20 bg-gradient-to-br from-slate-900 via-sluBlue to-blue-900 rounded-3xl p-8 md:p-12 text-white mt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Alumni Career Success Stories
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              Inspiring journeys of SLU alumni who transformed their careers
            </p>
          </div>
          {data.careerSuccessStories && Array.isArray(data.careerSuccessStories) && data.careerSuccessStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.careerSuccessStories.map((story) => (
                <GalleryHoverTooltip key={story.id} data={story} type="alumni">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden group cursor-pointer">
                    <div className="relative h-64 bg-gradient-to-br from-slate-900/90 to-sluBlue/90 p-6 flex items-end">
                      <img
                        src={story.photo}
                        alt={story.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.target.src = '/assets/alumni/student1.jpeg';
                        }}
                      />
                      <div className="relative z-10 text-white">
                        <h3 className="text-2xl font-bold mb-1">{story.name}</h3>
                        <p className="text-sm text-white/90">
                          {story.program} • {story.year}
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-4 pb-4 border-b border-white/20">
                        <p className="text-xs text-white/70 mb-1">Previous Role</p>
                        <p className="text-sm font-medium text-white/90">{story.previousRole}</p>
                        <p className="text-xs text-white/70 mb-1 mt-2">Current Role</p>
                        <p className="text-sm font-bold text-sluGold">
                          {story.currentRole} at {story.company}
                        </p>
                        <p className="text-xs text-white/70 mt-1">{story.location}</p>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed mb-4">{story.story || 'No story available.'}</p>
                      <div className="flex flex-wrap gap-2">
                        {story.achievements && Array.isArray(story.achievements) && story.achievements.length > 0 ? (
                          story.achievements.map((achievement, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-full bg-white/20 text-sluGold text-xs font-medium border border-white/30"
                            >
                              {achievement}
                            </span>
                          ))
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-white/20 text-sluGold text-xs font-medium border border-white/30">
                            SLU Graduate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GalleryHoverTooltip>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/10 rounded-2xl">
              <p className="text-white/80">No success stories available at this time.</p>
            </div>
          )}
        </section>

        {/* Section 4: Employer Feedback Showcase */}
        <section className="scroll-mt-20 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white mt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Employer Feedback Showcase
            </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                Approved testimonials and images showcasing SLU alumni achievements, work, and team collaboration submitted by employer partners
              </p>
          </div>
          {data.employerFeedbackStories && Array.isArray(data.employerFeedbackStories) && data.employerFeedbackStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.employerFeedbackStories.map((story) => (
                <GalleryHoverTooltip key={story.id} data={story} type="alumni">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden group cursor-pointer">
                    <div className="relative h-64 bg-gradient-to-br from-slate-900/90 to-purple-900/90 p-6 flex items-end">
                      <img
                        src={story.photo}
                        alt={story.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.target.src = '/assets/hero/engagement img1.jpeg';
                        }}
                      />
                      <div className="relative z-10 text-white">
                        <h3 className="text-2xl font-bold mb-1">{story.name}</h3>
                        <p className="text-sm text-white/90">
                          {story.program} • {story.company}
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-4 pb-4 border-b border-white/20">
                        <p className="text-xs text-white/70 mb-1">Job Role</p>
                        <p className="text-sm font-bold text-sluGold">
                          {story.currentRole} at {story.company}
                        </p>
                        <p className="text-xs text-white/70 mt-1">{story.location}</p>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed mb-4">{story.story || 'No story available.'}</p>
                      <div className="flex flex-wrap gap-2">
                        {story.achievements && Array.isArray(story.achievements) && story.achievements.length > 0 ? (
                          story.achievements.map((achievement, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-full bg-white/20 text-sluGold text-xs font-medium border border-white/30"
                            >
                              {achievement}
                            </span>
                          ))
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-white/20 text-sluGold text-xs font-medium border border-white/30">
                            SLU Graduate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GalleryHoverTooltip>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/10 rounded-2xl">
              <p className="text-white/80">No approved employer feedback available at this time. Approved feedback will appear here.</p>
            </div>
          )}
        </section>

        {/* Call to Action */}
        <GalleryFooter />
      </div>
    </div>
  );
};

export default GalleryPage;
