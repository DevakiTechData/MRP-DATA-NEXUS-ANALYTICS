import { useMemo, useState } from 'react';

// Floating chat assistant that responds with curated analytics explanations.
const AssistantChat = ({ title = 'DataNexus Assistant' }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I've loaded our latest alumni and employer analytics. Ask about engagement trends, retention, hiring, or predictions and I'll share the highlights.",
    },
  ]);

  const knowledgeBase = useMemo(
    () => [
      {
        id: 'engagement-forecast',
        keywords: ['engagement', 'forecast'],
        prompt: 'What does the engagement score forecast show?',
        response:
          'The engagement score forecast shows the current score climbing from 2.5 to roughly 2.74 by Q3 2025. The forecast band narrows quarter over quarter, signalling stable growth as mentoring and programming continue. Leadership should plan for a 9–10% uplift versus the baseline and lean into initiatives that keep the curve on its upper trajectory.',
      },
      {
        id: 'cohort-retention',
        keywords: ['cohort', 'retention'],
        prompt: 'How are cohort retention predictions calculated?',
        response:
          'Cohort retention projections blend the last three recruiting classes with the event engagement history. Year +1 retention is pacing at ~78%, year +2 at ~64%, and year +3 stabilises near 58%. The predictive layer weights recent event participation heavier so that spikes in programming quickly influence the forward view.',
      },
      {
        id: 'program-growth',
        keywords: ['program', 'growth'],
        prompt: 'Which programs are expected to see growth?',
        response:
          'MS Data Analytics and MS Information Systems lead the growth outlook, each projected to add 12–15% more actively engaged alumni over the next two semesters. MBA momentum is steady at ~8% growth, while the AI certificate program is inching toward double-digit gains thanks to employer demand for AI-aligned talent.',
      },
      {
        id: 'mentorship-impact',
        keywords: ['mentorship'],
        prompt: 'What impact is mentorship having?',
        response:
          'Mentorship cohorts that completed three touchpoints delivered a 22% lift in hiring outcomes versus peers without mentoring. Alumni mentees converted to full-time roles 1.4x faster, and satisfaction scores improved by five points. Scaling that playbook to new cohorts should stay a top priority.',
      },
      {
        id: 'alumni-funnel',
        keywords: ['engagement', 'funnel'],
        prompt: 'How is the alumni engagement funnel performing?',
        response:
          'The alumni funnel tracks awareness, event participation, mentorship, and hiring. Awareness is at 3,480 contacts, 1,260 attend events, 540 enter structured programs, and 190 reach hiring outcomes—an overall conversion of 5.4%. Each stage improved 1–2 points after the spring campaign, showing healthier progression.',
      },
      {
        id: 'event-insights',
        keywords: ['event', 'attendance'],
        prompt: 'What stands out in event engagement?',
        response:
          'Workshops and employer showcases are the top two event drivers, accounting for 62% of total attendance and generating the highest follow-up interest. Virtual briefings now contribute 18% of touchpoints and act as a reactivation lever for dormant alumni. Double down on hybrid formats to keep momentum.',
      },
      {
        id: 'pipeline-conversion',
        keywords: ['pipeline', 'conversion'],
        prompt: 'How is the employer pipeline converting?',
        response:
          'Employer outreach converts to talent pipelines at 34%, interviews at 19%, and signed offers at 12%. The tightened waterfall versus last quarter reflects faster screening cycles and better candidate prep. Keep reinforcing interview coaching—employers cite it as the highest leverage support.',
      },
      {
        id: 'growth-employers',
        keywords: ['employer', 'growth'],
        prompt: 'Which employers will expand hiring next quarter?',
        response:
          'Accenture, Bayer, Centene, and Deloitte all signal expanded requisitions, together adding ~45 incremental roles. High-growth startups in digital health and analytics are opening rotational analyst slots as well. Prioritise relationship touches with those accounts to lock in pipelines early.',
      },
      {
        id: 'diversity-hiring',
        keywords: ['diversity', 'hiring'],
        prompt: 'How is the diversity hiring mix trending?',
        response:
          'Women represent 48% of recent hires, up four points quarter-over-quarter, while international candidates hold steady at 22%. Visa sponsorship requests dipped slightly as domestic supply improved. Continue targeted outreach to maintain gender balance and support immigration paperwork for niche tech roles.',
      },
      {
        id: 'churn-risk',
        keywords: ['churn', 'risk'],
        prompt: 'What does the employer churn risk alert highlight?',
        response:
          'Three employers—GlobalFin, Horizon IoT, and Midwest Manufacturing—flag elevated churn risk due to declining engagement touchpoints and stalled requisitions. Recommended actions: schedule QBRs, offer curated candidate lists, and plug them into the mentorship showcase to re-energise the partnership.',
      },
      {
        id: 'predictive-outlook',
        keywords: ['predictive', 'outlook'],
        prompt: 'Summarise the predictive outlook.',
        response:
          'The predictive outlook projects steady alumni engagement acceleration, stable cohort retention, and employer hiring growth concentrated in data, healthcare, and consulting. Use the alumni tab for program-level forward views and the employer tab for account-level opportunity sizing and risk watchlists.',
      },
    ], []);

  const quickSuggestions = useMemo(() => knowledgeBase.slice(0, 6), [knowledgeBase]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const findResponse = (text) => {
    const lower = text.toLowerCase();

    const exactMatch = knowledgeBase.find((entry) => lower === entry.prompt.toLowerCase());
    if (exactMatch) {
      return exactMatch.response;
    }

    const keywordMatch = knowledgeBase.find((entry) => entry.keywords.every((keyword) => lower.includes(keyword)));
    if (keywordMatch) {
      return keywordMatch.response;
    }

    const partialMatch = knowledgeBase.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword)));
    if (partialMatch) {
      return partialMatch.response;
    }

    return null;
  };

  const handleSend = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage({ id: `user-${Date.now()}`, role: 'user', content: trimmed });
    setInput('');

    const response = findResponse(trimmed);

    appendMessage({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        response ||
        "I'm still learning that query. Try asking about engagement scores, retention, program momentum, employer growth, diversity hiring, or predictive outlook insights.",
    });
  };

  const handleQuick = (entry) => {
    handleSend(entry.prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-sluBlue text-white rounded-t-2xl">
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-slate-200">Powered by RAG knowledge retrieval</p>
            </div>
            <button type="button" onClick={handleToggle} className="text-white hover:text-sluGold">
              ✕
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-4 text-sm">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'assistant' ? 'flex justify-start' : 'flex justify-end'}
              >
                <div
                  className={
                    message.role === 'assistant'
                      ? 'max-w-[85%] whitespace-pre-line rounded-2xl bg-slate-100 px-3 py-2 text-slate-700'
                      : 'max-w-[85%] rounded-2xl bg-sluBlue px-3 py-2 text-white'
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          {quickSuggestions.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-2">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400 mb-2">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.slice(0, 4).map((faq) => (
                  <button
                    key={faq.prompt}
                    type="button"
                    onClick={() => handleQuick(faq)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-sluBlue hover:text-sluBlue"
                  >
                    {faq.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
            className="border-t border-slate-200 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about alumni or employer insights..."
                className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sluBlue focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-sluBlue px-3 py-2 text-xs font-semibold text-white hover:bg-sluBlue/90"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-2 rounded-full bg-sluBlue px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-sluBlue/90"
      >
        <span role="img" aria-label="assistant">🤖</span>
        {open ? 'Close Assistant' : 'Need forecast help?'}
      </button>
    </div>
  );
};

export default AssistantChat;
