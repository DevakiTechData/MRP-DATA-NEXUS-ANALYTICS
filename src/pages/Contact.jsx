import PageHero from '../components/PageHero';

const CORE_CONTACT = {
  address: 'Saint Louis University — DataNexus Center, 3672 Lindell Blvd, St. Louis, MO 63108',
  phone: '+1 (314) 977-2121',
  email: 'datanexus@slu.edu',
  officeHours: 'Monday – Friday, 8:30 AM – 5:30 PM (CT)',
};

const HIGHLIGHTS = [
  {
    id: 'alumni-network',
    metric: '1.8K+',
    label: 'Global Alumni & Mentors',
    description: 'Billiken graduates coaching current cohorts through strategic engagements.',
  },
  {
    id: 'employer-alliance',
    metric: '95',
    label: 'Employer Alliances',
    description: 'Innovation partners supporting hiring pipelines, residencies, and labs.',
  },
  {
    id: 'events',
    metric: '140+',
    label: 'Annual Engagements',
    description: 'Summits, showcases, and mentorship circles hosted by DataNexus teams.',
  },
];

const CONTACT_CHANNELS = [
  {
    id: 'alumni-relations',
    label: 'Alumni Relations & Mentorship',
    summary:
      'Reconnect with SLU, share success stories, or schedule mentoring engagements for current students.',
    contactName: 'ContactFirst1 ContactLast1',
    title: 'Sr Recruiter & Alumni Liaison',
    email: 'contact1@company1.com',
    phone: '+1-636-555-0001',
    preferred: 'Phone & Email',
    accent: 'from-sluBlue/10 to-sluBlue/0',
    icon: '🎓',
  },
  {
    id: 'employer-partnerships',
    label: 'Employer Partnerships & Hiring',
    summary:
      'Build immersive hiring pipelines, host innovation labs, or request tailored data talent spotlights.',
    contactName: 'ContactFirst3 ContactLast3',
    title: 'Engineering Manager, Employer Partnerships',
    email: 'contact3@company3.com',
    phone: '+1-636-555-0003',
    preferred: 'LinkedIn & Email',
    accent: 'from-sluGold/15 to-sluGold/0',
    icon: '🤝',
  },
  {
    id: 'events-collaboration',
    label: 'Events & Experiential Learning',
    summary:
      'Co-create DataNexus events, sponsor showcases, or collaborate on alumni engagement series.',
    contactName: 'Devaki Bathalapalli',
    title: 'Assistant Director, DataNexus Events',
    email: 'devaki.bathalapalli@slu.edu',
    phone: '+1 (314) 977-7850',
    preferred: 'Email',
    accent: 'from-slate-100 via-white to-slate-50',
    icon: '🎉',
  },
  {
    id: 'prospective-students',
    label: 'Prospective Students & Admissions',
    summary:
      'Discover SLU’s DataNexus graduate programs, curriculum pathways, and financing resources.',
    contactName: 'ContactFirst8 ContactLast8',
    title: 'Graduate Admissions Partner',
    email: 'contact8@company8.com',
    phone: '+1-636-555-0008',
    preferred: 'Phone & Virtual Advising',
    accent: 'from-sky-100 to-sky-50',
    icon: '📘',
  },
];

const SUPPORT_RESOURCES = [
  {
    label: 'Visit SLU DataNexus',
    description: 'Schedule an in-person tour of the labs, collaboration hubs, and innovation studios.',
    linkLabel: 'Book a Visit',
    linkHref: 'https://www.slu.edu/visit/index.php',
  },
  {
    label: 'Download Program Guide',
    description:
      'Review cohort outcomes, curriculum overviews, and employer collaboration highlights.',
    linkLabel: 'View PDF',
    linkHref: 'https://www.slu.edu/science-and-engineering/graduate-programs.php',
  },
  {
    label: 'Engagement Calendar',
    description:
      'Explore upcoming summits, mentorship circles, and alumni showcases hosted by DataNexus.',
    linkLabel: 'Open Calendar',
    linkHref: '/events',
  },
];

const CONTACT_HERO_IMAGES = [
  {
    src: '/assets/hero/campus img1.jpg',
    alt: 'Saint Louis University campus center',
    caption: 'Anchored in the heart of St. Louis, where collaboration thrives.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'DataNexus engagement event',
    caption: 'Engagement events connecting alumni, students, and employer partners.',
  },
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'Alumni proudly representing SLU',
    caption: 'A global alumni network ready to support the next generation of Billikens.',
  },
];

const Contact = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <PageHero
        images={CONTACT_HERO_IMAGES}
        eyebrow="Connect with SLU DataNexus"
        title="Let’s Co-Create Transformational Data Careers"
        subtitle="Alumni, employers, students, and partners — we’re here for you"
        description="Whether you are mentoring, recruiting, or exploring graduate pathways, the DataNexus team ensures every collaboration delivers meaningful impact across our community."
        actions={[
          { href: 'mailto:datanexus@slu.edu', label: 'Email DataNexus' },
          { to: '/events', label: 'Explore Events', variant: 'secondary' },
        ]}
        align="left"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] items-start">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-slate-800">DataNexus Central Office</h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Visit us at the heart of SLU’s Midtown campus or connect virtually with our engagement
                advisors.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {HIGHLIGHTS.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="rounded-2xl bg-gradient-to-br from-sluBlue/10 via-white to-sluBlue/5 border border-slate-200 px-5 py-6 shadow-sm"
                  >
                    <p className="text-3xl font-bold text-sluBlue">{highlight.metric}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{highlight.label}</p>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 px-5 py-6 shadow-sm space-y-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-sluBlue">Address</dt>
                <dd className="text-base leading-relaxed text-slate-800">{CORE_CONTACT.address}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 px-5 py-6 shadow-sm space-y-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-sluBlue">Phone</dt>
                <dd className="text-lg font-semibold text-slate-800">{CORE_CONTACT.phone}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 px-5 py-6 shadow-sm space-y-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-sluBlue">Email</dt>
                <dd className="leading-relaxed">
                  <a href={`mailto:${CORE_CONTACT.email}`} className="text-sluBlue font-semibold hover:underline">
                    {CORE_CONTACT.email}
                  </a>
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 px-5 py-6 shadow-sm space-y-2">
                <dt className="text-xs uppercase tracking-[0.2em] text-sluBlue">Office Hours</dt>
                <dd className="text-base text-slate-800">{CORE_CONTACT.officeHours}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
        <section aria-labelledby="contact-channels-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 id="contact-channels-heading" className="text-3xl font-semibold text-slate-800">
                Tailored Support for Every Partner
              </h2>
              <p className="text-slate-600 mt-2 max-w-3xl">
                Reach out to the specialist who best aligns with your goals. Each contact draws from
                our employer and alumni engagement network showcased across the DataNexus dashboards.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {CONTACT_CHANNELS.map((channel) => (
              <article
                key={channel.id}
                className="h-full bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${channel.accent} pointer-events-none`}
                  aria-hidden="true"
                />
                <div className="relative space-y-2">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/70 text-2xl shadow-sm">
                    {channel.icon}
                  </span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-sluBlue/80">
                    Preferred: {channel.preferred}
                  </span>
                  <h3 className="text-xl font-semibold text-slate-800">{channel.label}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{channel.summary}</p>
                </div>
                <div className="relative mt-6 rounded-xl bg-slate-50/90 border border-slate-200 p-4 space-y-2 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{channel.contactName}</p>
                  <p>{channel.title}</p>
                  <p>
                    <a href={`mailto:${channel.email}`} className="text-sluBlue hover:underline">
                      {channel.email}
                    </a>
                  </p>
                  <p>{channel.phone}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="support-resources-heading"
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <h2 id="support-resources-heading" className="text-3xl font-semibold text-slate-800">
                Additional Resources
              </h2>
              <p className="text-slate-600 text-base">
                Continue your DataNexus journey with curated links for visits, program discovery, and
                upcoming experiences.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {SUPPORT_RESOURCES.map((resource) => (
              <div
                key={resource.label}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-6 py-6 flex flex-col gap-3 text-sm text-slate-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-lg font-semibold text-slate-900">{resource.label}</p>
                <p className="leading-relaxed flex-1 text-sm text-slate-600">
                  {resource.description}
                </p>
                <a
                  href={resource.linkHref}
                  className="inline-flex items-center font-semibold text-sluBlue hover:underline"
                >
                  {resource.linkLabel}
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </a>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="contact-to-action-heading">
          <div className="bg-gradient-to-r from-sluBlue via-sluBlue/95 to-blue-700 rounded-3xl px-6 sm:px-12 py-12 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-3 max-w-3xl">
                <h2 id="contact-to-action-heading" className="text-3xl font-semibold">
                  Ready to Launch a New Collaboration?
                </h2>
                <p className="text-slate-100 leading-relaxed">
                  Share your upcoming project ideas with our events team or dive deeper into alumni and
                  employer stories through the dashboards. We’ll route your inquiry to the right partner
                  within one business day.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:datanexus@slu.edu"
                  className="inline-flex items-center justify-center rounded-2xl bg-white text-sluBlue font-semibold px-6 py-3 shadow hover:shadow-md transition"
                >
                  Email DataNexus
                </a>
                <a
                  href="/events"
                  className="inline-flex items-center justify-center rounded-2xl border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                >
                  View Events
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;

