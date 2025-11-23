import { Link } from 'react-router-dom';

const GalleryFooter = () => {
  return (
    <section className="container mx-auto px-4">
      <div className="bg-gradient-to-r from-sluBlue via-blue-700 to-sluBlue rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
      <h3 className="text-3xl font-bold mb-4">Want to be featured in the Gallery?</h3>
      <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
        Alumni and employers can share success stories, event highlights, and testimonials to
        inspire the SLU community.
      </p>
      <Link
        to="/contact"
        className="inline-flex items-center px-8 py-4 rounded-full bg-white text-sluBlue font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      >
        Contact SLU Engagement Office
      </Link>
      </div>
    </section>
  );
};

export default GalleryFooter;

