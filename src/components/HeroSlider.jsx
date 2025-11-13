import { useEffect, useMemo, useState } from 'react';

const DEFAULT_HERO_IMAGES = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'Alumni Celebrating Success',
    caption: 'Celebrating SLU alumni achievements around the globe.',
  },
  {
    src: '/assets/hero/Alumni img1.jpg',
    alt: 'Student Networking',
    caption: 'Building lifelong connections through SLU networking events.',
  },
  {
    src: '/assets/hero/alumni img2.jpg',
    alt: 'Career Fair',
    caption: 'Career fairs connecting students with leading employers.',
  },
  {
    src: '/assets/hero/alumni img4.jpg',
    alt: 'Graduation Moment',
    caption: 'Proud graduates stepping into their next chapter.',
  },
  {
    src: '/assets/hero/Alumni img5.jpg',
    alt: 'Mentorship Session',
    caption: 'Mentorship sessions guiding the next generation of leaders.',
  },
  {
    src: '/assets/hero/campus img1.jpg',
    alt: 'SLU Campus',
    caption: 'Inspiring campus spaces fostering collaboration.',
  },
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Engagement Event',
    caption: 'Engagement events that strengthen alumni bonds.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'Community Gathering',
    caption: 'Community gatherings creating meaningful impact.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Innovation Workshop',
    caption: 'Innovation workshops exploring future-ready skills.',
  },
  {
    src: '/assets/hero/img1.jpeg',
    alt: 'Global Alumni',
    caption: 'Global alumni network spanning six continents.',
  },
  {
    src: '/assets/hero/Jsuit Img1.jpg',
    alt: 'Jesuit Tradition',
    caption: 'Jesuit tradition inspiring service and leadership.',
  },
];

const HeroSlider = ({ interval = 7000, children, images }) => {
  const slides = useMemo(
    () => (images && images.length ? images : DEFAULT_HERO_IMAGES).filter((img) => !!img?.src),
    [images],
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(
      () => setCurrent((prev) => (prev + 1) % slides.length),
      interval
    );
    return () => clearInterval(timer);
  }, [slides.length, interval]);

  if (slides.length === 0) {
    return null;
  }

  const goToSlide = (index) => setCurrent(index % slides.length);
  const nextSlide = () => goToSlide((current + 1) % slides.length);
  const prevSlide = () => goToSlide((current - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-white/15 bg-black/5">
      <div className="relative min-h-[420px] md:min-h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <p className="text-sm md:text-base font-medium drop-shadow-lg max-w-2xl">
                {slide.caption}
              </p>
            </div>
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center px-4 md:px-16 text-white text-center pointer-events-none">
          <div className="space-y-4 md:space-y-6 max-w-4xl pointer-events-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
            {children}
          </div>
        </div>

        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/65 hover:bg-white text-sluBlue rounded-full p-2 transition-colors shadow-md"
          aria-label="Previous slide"
        >
          ←
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/65 hover:bg-white text-sluBlue rounded-full p-2 transition-colors shadow-md"
          aria-label="Next slide"
        >
          →
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={`indicator-${index}`}
            type="button"
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === current ? 'bg-sluGold w-8' : 'bg-white/60 w-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;

