import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';

const GALLERY_HERO_IMAGES = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'SLU students presenting projects',
    caption: 'Showcasing DataNexus innovation across programs.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Employer collaboration at DataNexus event',
    caption: 'Co-creating solutions with our employer partners.',
  },
  {
    src: '/assets/hero/Jsuit Img1.jpg',
    alt: 'Saint Louis University campus and traditions',
    caption: 'Rooted in SLU’s Jesuit mission and values.',
  },
];

const GALLERY_ITEMS = [
  {
    id: 'msis-2021-showcase',
    title: 'Innovation Systems Showcase',
    program: 'MS Information Systems',
    year: 2021,
    image: '/assets/alumni/student1.jpeg',
    description:
      'Capstone project presentations featuring data integration labs with regional partners.',
  },
  {
    id: 'msis-2023-mentorship',
    title: 'Tech Mentorship Circles',
    program: 'MS Information Systems',
    year: 2023,
    image: '/assets/alumni/student9.jpg',
    description:
      'Peer-led mentorship series connecting alumni mentors with current cohort teams.',
  },
  {
    id: 'ai-2022-summit',
    title: 'Applied AI Summit',
    program: 'MS Artificial Intelligence',
    year: 2022,
    image: '/assets/alumni/student2.jpg',
    description:
      'Hands-on summit where teams deployed ethical AI prototypes for community services.',
  },
  {
    id: 'ai-2024-lab',
    title: 'Cognitive Computing Lab',
    program: 'MS Artificial Intelligence',
    year: 2024,
    image: '/assets/alumni/student7.jpg',
    description:
      'Industry lab in partnership with Arch Innovators exploring responsible automation.',
  },
  {
    id: 'ml-2023-research',
    title: 'Machine Learning Research Sprint',
    program: 'MS Machine Learning',
    year: 2023,
    image: '/assets/alumni/student3.jpg',
    description:
      'Students analyzed five-year hiring trends to design predictive placement models.',
  },
  {
    id: 'ml-2025-hackathon',
    title: 'Model Ops Hackathon',
    program: 'MS Machine Learning',
    year: 2025,
    image: '/assets/alumni/student10.jpg',
    description:
      'Weekend-long sprint optimizing model deployment pipelines with alumni coaches.',
  },
  {
    id: 'cyber-2020-blue-team',
    title: 'Cyber Defense Blue Team Labs',
    program: 'MS Cyber Security',
    year: 2020,
    image: '/assets/alumni/student4.jpg',
    description:
      'Blue team simulations with regional employers focused on zero-trust architecture.',
  },
  {
    id: 'cyber-2024-cloudshield',
    title: 'CloudShield Security Challenge',
    program: 'MS Cyber Security',
    year: 2024,
    image: '/assets/alumni/student11.jpeg',
    description:
      'Students hardened cloud workloads and presented threat reports to partner CISOs.',
  },
  {
    id: 'analytics-2021-dataquest',
    title: 'Business Analytics DataQuest',
    program: 'MS Business Analytics',
    year: 2021,
    image: '/assets/alumni/student5.jpg',
    description:
      'Cross-functional teams leveraged SLU engagement data to surface insight dashboards.',
  },
  {
    id: 'analytics-2025-visualization',
    title: 'Analytics Visualization Studio',
    program: 'MS Business Analytics',
    year: 2025,
    image: '/assets/alumni/student12.jpeg',
    description:
      'Storytelling studio highlighting alumni career pathways with interactive visuals.',
  },
  {
    id: 'data-2020-lab',
    title: 'Data Analytics Innovation Lab',
    program: 'MS Data Analytics',
    year: 2020,
    image: '/assets/alumni/student6.jpeg',
    description:
      'Alumni-led lab showcasing predictive enrollment and engagement analytics.',
  },
  {
    id: 'statistics-2022-symposium',
    title: 'Applied Statistics Symposium',
    program: 'MS Statistics',
    year: 2022,
    image: '/assets/alumni/student7.jpg',
    description:
      'Symposium on advanced statistical modeling supporting SLU community initiatives.',
  },
  {
    id: 'computer-science-2023-lab',
    title: 'Emerging Tech Innovation Lab',
    program: 'MS Computer Science',
    year: 2023,
    image: '/assets/alumni/student8.jpg',
    description:
      'Prototype gallery featuring immersive analytics and responsive campus applications.',
  },
  {
    id: 'partnership-2021-arch',
    title: 'Arch Innovators Partnership Launch',
    program: 'Employer Collaborations',
    year: 2021,
    image: '/assets/employers/Comp img1.jpeg',
    description:
      'Employer immersion day welcoming Arch Innovators to co-create analytics residencies.',
  },
  {
    id: 'partnership-2022-bio',
    title: 'BioHealth Data Challenge',
    program: 'Employer Collaborations',
    year: 2022,
    image: '/assets/employers/Comp img2.jpg',
    description:
      'BioHealth teams mentored students on patient-centered data visualization strategies.',
  },
  {
    id: 'partnership-2024-elevate',
    title: 'Elevate Tech Collaborative',
    program: 'Employer Collaborations',
    year: 2024,
    image: '/assets/employers/Comp img4.jpg',
    description:
      'Joint summit focused on inclusive hiring, alumni spotlights, and capstone showcases.',
  },
];

const Gallery = () => {
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedYear, setSelectedYear] = useState('All Years');

  const programOptions = useMemo(() => {
    const uniquePrograms = Array.from(new Set(GALLERY_ITEMS.map((item) => item.program))).sort();
    return ['All Programs', ...uniquePrograms];
  }, []);

  const yearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(GALLERY_ITEMS.map((item) => item.year))).sort((a, b) => a - b);
    return ['All Years', ...uniqueYears];
  }, []);

  const filteredItems = useMemo(() => {
    return GALLERY_ITEMS.filter((item) => {
      const matchesProgram =
        selectedProgram === 'All Programs' || item.program === selectedProgram;
      const matchesYear = selectedYear === 'All Years' || item.year === Number(selectedYear);
      return matchesProgram && matchesYear;
    });
  }, [selectedProgram, selectedYear]);

  const groupedItems = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach((item) => {
      if (!groups.has(item.program)) {
        groups.set(item.program, []);
      }
      groups.get(item.program).push(item);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <PageHero
        images={GALLERY_HERO_IMAGES}
        eyebrow="SLU DataNexus"
        title="Experience Our Program Gallery"
        subtitle="Immersive projects, alumni journeys, and employer collaborations"
        description="Filter by academic track or year to explore spotlights across DataNexus programs, alumni success stories, and industry partnerships that define the SLU experience."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#gallery-filters', label: 'Browse Gallery' },
        ]}
      />
      <div id="gallery-filters" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Program Type
              </label>
              <select
                value={selectedProgram}
                onChange={(event) => setSelectedProgram(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
              >
                {programOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-slate-600 mb-2">Academic Year</label>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-12">
          {groupedItems.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
              No gallery items match the selected filters. Try expanding to additional programs or
              years.
            </div>
          ) : (
            groupedItems.map(([program, items]) => (
              <section key={program} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800">{program}</h2>
                  <p className="text-slate-600 mt-1">
                    Celebrating immersive learning experiences and community impact from the{' '}
                    {program} track.
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-slate-200 flex flex-col"
                    >
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="h-48 w-full object-cover"
                        />
                        <span className="absolute top-3 left-3 bg-sluGold text-sluBlue text-xs font-semibold px-3 py-1 rounded-full shadow">
                          {item.year}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{item.title}</h3>
                        <p className="text-sm text-slate-600 flex-1 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="inline-flex items-center text-sm font-medium text-sluBlue">
                          View Story
                          <span className="ml-2" aria-hidden="true">
                            →
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;

