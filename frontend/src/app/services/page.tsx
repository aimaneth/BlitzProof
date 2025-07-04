'use client';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, Search, FileText, RefreshCw, CheckCircle, UserCheck, ArrowRight, X } from 'lucide-react';
import { Spotlight } from '@/components/sections/hero';
import { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/layout';

interface FormState {
  project: string;
  name: string;
  email: string;
  job: string;
  contact: string;
  services: string[];
  notes: string;
}
interface FormErrors {
  project?: string;
  name?: string;
  email?: string;
  job?: string;
  services?: string;
}

const auditSteps = [
  {
    icon: <UserCheck className="h-6 w-6" />, 
    title: 'Initial Consultation',
    desc: 'We discuss your project goals, timeline, and specific security requirements to customize the audit scope.'
  },
  {
    icon: <Search className="h-6 w-6" />, 
    title: 'Automated Analysis',
    desc: 'Advanced scanning tools analyze your smart contracts for known vulnerabilities and common security patterns.'
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />, 
    title: 'Manual Expert Review',
    desc: 'Our security specialists perform deep manual analysis to identify complex logic flaws and business risks.'
  },
  {
    icon: <FileText className="h-6 w-6" />, 
    title: 'Detailed Reporting',
    desc: 'Comprehensive report with findings, severity ratings, and step-by-step remediation recommendations.'
  },
  {
    icon: <RefreshCw className="h-6 w-6" />, 
    title: 'Remediation Support',
    desc: 'Ongoing guidance to fix vulnerabilities with code reviews and re-auditing until fully secure.'
  },
  {
    icon: <CheckCircle className="h-6 w-6" />, 
    title: 'Certification',
    desc: 'Official BlitzProof security certificate and on-chain verification for public trust and transparency.'
  },
];

const serviceOptions = [
  'Auditing',
  'Penetration Testing',
  'Team Verification, Contract Verification, Bug Bounty',
  'Advisory or other services',
  'Compliance/AML',
];

const faqData = [
  {
    q: 'What is a smart contract audit?',
    a: 'A smart contract audit is a security assessment of your blockchain codebase to identify vulnerabilities, logic errors, and compliance issues before deployment.'
  },
  {
    q: 'How long does an audit take?',
    a: 'Most audits are completed in 5-10 business days, depending on code complexity and project scope.'
  },
  {
    q: 'What do I receive after the audit?',
    a: 'You receive a detailed report, remediation guidance, and (if passed) a public certification badge and on-chain verification.'
  },
  {
    q: 'Is my audit confidential?',
    a: 'Yes, all audits are confidential by default. Public disclosure is optional and only with your consent.'
  },
  {
    q: 'How much does an audit cost?',
    a: 'Pricing depends on code complexity, size, and urgency. Contact us for a custom quote.'
  },
];

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    project: '',
    name: '',
    email: '',
    job: '',
    contact: '',
    services: [],
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
const [securityScore, setSecurityScore] = useState({
  complexity: 'Medium (5-20 functions)',
  assetValue: '$1M - $10M',
  timeline: '2-4 weeks'
});
const [calculatedScore, setCalculatedScore] = useState(85);
const [estimatedPrice, setEstimatedPrice] = useState('$5,000');
const [estimatedTimeline, setEstimatedTimeline] = useState('5-7 days');
const [riskLevel, setRiskLevel] = useState('Medium');

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(f => ({
        ...f,
        services: checked
          ? [...f.services, value]
          : f.services.filter(s => s !== value),
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.project) errs.project = 'Required';
    if (!form.name) errs.name = 'Required';
    if (!form.email) errs.email = 'Required';
    if (!form.job) errs.job = 'Required';
    if (!form.services.length) errs.services = 'Select at least one';
    return errs;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      // Here you could send the form data to an API
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitted(false);
    setForm({
      project: '', name: '', email: '', job: '', contact: '', services: [], notes: ''
    });
    setErrors({});
  }

  const calculateSecurityScore = useCallback(() => {
    let score = 50; // Base score
    let price = 0;
    let timeline = '7-10 days';
    let risk = 'Low';

    // Base pricing by complexity (MOST IMPORTANT FACTOR)
    if (securityScore.complexity.includes('Simple')) {
      score += 20;
      price = 1500;
      timeline = '3-5 days';
    } else if (securityScore.complexity.includes('Medium')) {
      score += 10;
      price = 4000;
      timeline = '5-7 days';
    } else if (securityScore.complexity.includes('Complex')) {
      score -= 10;
      price = 8000;
      timeline = '7-10 days';
    } else if (securityScore.complexity.includes('Enterprise')) {
      score -= 20;
      price = 20000;
      timeline = '10-14 days';
    }

    // Asset value multiplier (SMALLER IMPACT)
    let assetMultiplier = 1.0;
    if (securityScore.assetValue.includes('Under $100K')) {
      score += 15;
      assetMultiplier = 0.85; // 15% discount for low value
    } else if (securityScore.assetValue.includes('$100K - $1M')) {
      score += 5;
      assetMultiplier = 0.95; // 5% discount
    } else if (securityScore.assetValue.includes('$1M - $10M')) {
      score -= 5;
      assetMultiplier = 1.05; // 5% premium
    } else if (securityScore.assetValue.includes('Over $10M')) {
      score -= 15;
      assetMultiplier = 1.25; // 25% premium for high value
    }

    // Timeline multiplier (SMALLER IMPACT)
    let timelineMultiplier = 1.0;
    if (securityScore.timeline.includes('1-2 weeks')) {
      score -= 10;
      timelineMultiplier = 1.25; // 25% rush premium
    } else if (securityScore.timeline.includes('2-4 weeks')) {
      score -= 5;
      timelineMultiplier = 1.1; // 10% rush premium
    } else if (securityScore.timeline.includes('1-2 months')) {
      score += 5;
      timelineMultiplier = 1.0; // No change
    } else if (securityScore.timeline.includes('No rush')) {
      score += 10;
      timelineMultiplier = 0.9; // 10% discount for relaxed timeline
    }

    // Apply multipliers to base price
    price = Math.round(price * assetMultiplier * timelineMultiplier);

    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    if (score >= 80) risk = 'Low';
    else if (score >= 60) risk = 'Medium';
    else risk = 'High';

    setCalculatedScore(score);
    setEstimatedPrice(`$${price.toLocaleString()}`);
    setEstimatedTimeline(timeline);
    setRiskLevel(risk);
  }, [securityScore]);

  function handleSecurityScoreChange(field: string, value: string) {
    setSecurityScore(prev => ({ ...prev, [field]: value }));
  }

  // Recalculate score whenever securityScore changes
  useEffect(() => {
    calculateSecurityScore();
  }, [securityScore, calculateSecurityScore]);

  return (
    <Layout>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-background -z-10"></div>
        <Spotlight />
      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg bg-black border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 text-left animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{
              animation: 'fadeIn .2s',
              boxShadow: '0 0 32px 0 rgba(80, 120, 255, 0.25), 0 0 0 4px rgba(80,120,255,0.10)',
              outline: '2px solid hsl(var(--primary) / 0.25)',
              outlineOffset: '-4px',
            }}
          >
            <button type="button" onClick={closeModal} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-muted-foreground hover:text-primary">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-primary pr-8">Start Your Security Journey</h2>
            {submitted ? (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                <div className="text-base sm:text-lg font-semibold mb-2 text-foreground">Thank you!</div>
                <div className="text-sm sm:text-base text-muted-foreground">We received your request and will contact you soon.</div>
                <button type="button" onClick={closeModal} className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base">Close</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-3">
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-xs font-medium text-foreground">Project/Company Name<span className="text-primary">*</span></label>
                    <input name="project" value={form.project} onChange={handleChange} className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                    {errors.project && <div className="text-red-500 text-xs mt-1">{errors.project}</div>}
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-foreground">Your Full Name<span className="text-primary">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                    {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-foreground">Email<span className="text-primary">*</span></label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-foreground">Job Title<span className="text-primary">*</span></label>
                    <input name="job" value={form.job} onChange={handleChange} className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                    {errors.job && <div className="text-red-500 text-xs mt-1">{errors.job}</div>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-xs font-medium text-foreground">Telegram / WeChat / Others</label>
                    <input name="contact" value={form.contact} onChange={handleChange} placeholder="Telegram Handle, WeChat Number, WhatsApp Number, or any preferred method." className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-xs font-medium text-foreground">Please select the services that you are interested in<span className="text-primary">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceOptions.map(option => (
                      <label key={option} className="flex items-center gap-2 text-xs text-foreground bg-background/60 rounded-lg px-2 py-1 border border-white/10 cursor-pointer hover:border-primary transition-colors">
                        <input
                          type="checkbox"
                          name="services"
                          value={option}
                          checked={form.services.includes(option)}
                          onChange={handleChange}
                          className="accent-primary"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.services && <div className="text-red-500 text-xs mt-1">{errors.services}</div>}
                </div>
                <div className="mb-4">
                  <label className="block mb-1 text-xs font-medium text-foreground">Additional Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-foreground focus:outline-none focus:border-primary text-sm" />
                </div>
                <button type="submit" className="w-full py-2 sm:py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm sm:text-base">Submit Request</button>
              </>
            )}
          </form>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-12 sm:pb-16 px-4 relative z-10">
        <div className="mx-auto max-w-6xl text-center relative z-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Professional Smart Contract Security
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            BlitzProof delivers enterprise-grade smart contract audits and verification services. 
            Protect your blockchain applications with our comprehensive security solutions.
          </p>
          
          {/* Security Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-primary">500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Contracts Audited</div>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-primary">$2B+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Assets Protected</div>
            </div>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-primary">99.8%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center relative z-30 px-4">
            <button onClick={() => setModalOpen(true)} className="px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative z-40 text-sm sm:text-base">
              Start Your Audit
            </button>
            <Link href="/scanner" className="px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-all relative z-40 text-sm sm:text-base">
              Try Free Scanner
            </Link>
          </div>
        </div>
      </section>

      {/* What is a Smart Contract Audit? */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-foreground">What is a Smart Contract Audit?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              A comprehensive security assessment of your blockchain codebase to identify vulnerabilities, 
              logic errors, and security risks before deployment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {/* Left Column - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-6 sm:p-8 h-full">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Security First</h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                  Smart contract audits are essential for protecting user funds, ensuring compliance, 
                  and building trust in your project. Our expert team uses advanced tools and manual 
                  analysis to identify potential vulnerabilities.
                </p>
                
                {/* Key Benefits */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Prevent Exploits</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Identify and fix vulnerabilities before they can be exploited</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Build Trust</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Demonstrate security commitment to users and investors</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Ensure Compliance</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Meet industry standards and regulatory requirements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Process */}
            <div className="relative">
              <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-6 sm:p-8 h-full">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Our Process</h3>
                </div>
                
                {/* Process Steps */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-1 text-xs sm:text-sm font-bold text-primary-foreground">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Automated Analysis</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Advanced scanning tools analyze your contracts for known vulnerabilities</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-1 text-xs sm:text-sm font-bold text-primary-foreground">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Manual Review</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Expert security specialists perform deep manual analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-1 text-xs sm:text-sm font-bold text-primary-foreground">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Detailed Reporting</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Comprehensive findings with severity ratings and remediation steps</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-1 text-xs sm:text-sm font-bold text-primary-foreground">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Verification</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">On-chain verification and public certification for transparency</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-foreground">What&apos;s Included</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Comprehensive deliverables and expert analysis to secure your smart contracts
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Deliverables */}
            <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-6 sm:p-8 group hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Deliverables</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Comprehensive Report</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Detailed PDF and web-based audit report</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Severity Rankings</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Prioritized findings with clear recommendations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Remediation Support</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Step-by-step guidance and re-audit services</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Public Verification</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">On-chain verification and public certification badge</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sample Findings */}
            <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-6 sm:p-8 group hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Sample Findings</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Reentrancy Attacks</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Critical vulnerability allowing fund theft</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Access Control</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Unauthorized function access risks</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Arithmetic Issues</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Overflow/underflow vulnerabilities</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Logic Errors</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Business logic and gas inefficiencies</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Certification */}
            <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-6 sm:p-8 group hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Certification</h3>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-primary">Audit Badge</span>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Public verification badge for transparency</p>
                </div>
                
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-primary">On-Chain Proof</span>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Immutable verification on blockchain</p>
                </div>
                
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-primary">Marketing Support</span>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Optional public disclosure assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Score Calculator */}
      <section className="py-12 sm:py-16 px-4 relative z-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-foreground">Get Your Security Score</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Calculate your project&apos;s security risk and get an instant audit estimate</p>
          </div>
          
          <Card className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative z-30" style={{
            boxShadow: '0 0 32px 0 rgba(80, 120, 255, 0.15), 0 0 0 1px rgba(80, 120, 255, 0.1)',
            outline: '1px solid rgba(80, 120, 255, 0.2)',
            outlineOffset: '-2px'
          }}>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-primary">Project Assessment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Contract Complexity</label>
                      <select 
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary relative z-40 text-sm"
                        value={securityScore.complexity}
                        onChange={(e) => handleSecurityScoreChange('complexity', e.target.value)}
                        style={{ position: 'relative', zIndex: 50 }}
                      >
                        <option>Simple (1-5 functions)</option>
                        <option>Medium (5-20 functions)</option>
                        <option>Complex (20+ functions)</option>
                        <option>Enterprise (Multiple contracts)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Asset Value</label>
                      <select 
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary relative z-40 text-sm"
                        value={securityScore.assetValue}
                        onChange={(e) => handleSecurityScoreChange('assetValue', e.target.value)}
                        style={{ position: 'relative', zIndex: 50 }}
                      >
                        <option>Under $100K</option>
                        <option>$100K - $1M</option>
                        <option>$1M - $10M</option>
                        <option>Over $10M</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Deployment Timeline</label>
                      <select 
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary relative z-40 text-sm"
                        value={securityScore.timeline}
                        onChange={(e) => handleSecurityScoreChange('timeline', e.target.value)}
                        style={{ position: 'relative', zIndex: 50 }}
                      >
                        <option>1-2 weeks</option>
                        <option>2-4 weeks</option>
                        <option>1-2 months</option>
                        <option>No rush</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="relative bg-gradient-to-br from-black/80 to-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Score Circle */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                        <div className="absolute inset-0 rounded-full border-3 border-white/10"></div>
                        <div 
                          className="absolute inset-0 rounded-full border-3 border-transparent border-t-primary border-r-primary transition-all duration-1000 ease-out"
                          style={{
                            transform: `rotate(${calculatedScore * 3.6}deg)`,
                            background: `conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary) / 0.6) ${calculatedScore * 3.6}deg, transparent ${calculatedScore * 3.6}deg)`
                          }}
                        ></div>
                        <div className="absolute inset-1.5 rounded-full bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-primary">{calculatedScore}</div>
                            <div className="text-xs text-muted-foreground">/100</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <div className="text-base sm:text-lg font-semibold text-foreground mb-1">Security Score</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mb-3">
                          {riskLevel === 'Low' ? '🟢 Low Risk' : 
                           riskLevel === 'Medium' ? '🟡 Medium Risk' : 
                           '🔴 High Risk'}
                        </div>
                        
                        {/* Compact Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Timeline:</span>
                            <span className="text-foreground font-medium">{estimatedTimeline}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="text-primary font-bold">{estimatedPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setModalOpen(true)} className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base">
                    Get Detailed Quote
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Client Success Stories */}
      <section className="py-12 sm:py-16 px-4 bg-black/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-foreground">Trusted by Leading Projects</h2>
            <p className="text-sm sm:text-base text-muted-foreground">See how we&apos;ve protected billions in digital assets</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <Card className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-xl rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-base sm:text-lg">D</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">DeFi Protocol</h4>
                    <p className="text-xs text-muted-foreground">$500M TVL</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">&quot;BlitzProof&apos;s audit was comprehensive and professional. They found critical vulnerabilities that could have cost us millions.&quot;</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Protected: $500M</div>
                  <div className="flex items-center text-primary">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-xl rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-base sm:text-lg">N</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">NFT Marketplace</h4>
                    <p className="text-xs text-muted-foreground">$200M Volume</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">&quot;The team was responsive and thorough. Their security recommendations were invaluable for our launch.&quot;</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Protected: $200M</div>
                  <div className="flex items-center text-primary">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-xl rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold text-base sm:text-lg">G</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">Gaming Platform</h4>
                    <p className="text-xs text-muted-foreground">$300M Assets</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">&quot;Professional service from start to finish. Their expertise in gaming contracts is unmatched.&quot;</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Protected: $300M</div>
                  <div className="flex items-center text-primary">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          

        </div>
      </section>

      {/* Supported Networks */}
      <section className="py-8 sm:py-12 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-foreground">Supported Networks</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">We support all major EVM and non-EVM blockchains, including:</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-4">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Ethereum</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">BNB Chain</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Polygon</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Arbitrum</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Optimism</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Avalanche</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Fantom</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Solana</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Aptos</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">Sui</span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-black/60 border border-white/10 text-xs sm:text-sm text-foreground hover:border-primary/50 transition-colors cursor-pointer">And more...</span>
          </div>
        </div>
      </section>

      {/* Services Cards */}
      <section className="py-12 sm:py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-foreground">Our Core Services</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="group relative bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-2xl rounded-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 lg:p-10 relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 sm:p-3 bg-primary/20 rounded-xl mr-3 sm:mr-4">
                    <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">Smart Contract Audit</h3>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                  Comprehensive security analysis combining automated tools with expert manual review. 
                  Identify vulnerabilities, optimize gas usage, and ensure your contracts are production-ready.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Automated Scanning
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Manual Review
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Gas Optimization
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Detailed Reports
                  </div>
                </div>
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors group text-sm sm:text-base">
                  Request Audit
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </CardContent>
            </Card>

            <Card className="group relative bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-2xl rounded-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 lg:p-10 relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 sm:p-3 bg-primary/20 rounded-xl mr-3 sm:mr-4">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">Contract Verification</h3>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                  On-chain verification and public certification of your smart contracts. 
                  Build user trust with transparent security attestations and verified source code.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Source Verification
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Security Certificates
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Explorer Integration
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary mr-2" />
                    Public Reports
                  </div>
                </div>
                <button onClick={() => setModalOpen(true)} className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors group text-sm sm:text-base">
                  Verify Contract
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Audit Process */}
      <section className="py-12 sm:py-16 px-4 bg-black/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-foreground">Our Proven Audit Process</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Six comprehensive steps ensuring your smart contracts meet the highest security standards
            </p>
          </div>
          
          <div className="relative">
            {/* Desktop Process Flow - Single Row */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-6 gap-4">
                {auditSteps.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-xl p-4 text-center hover:border-primary/30 transition-all duration-300 group h-full">
                      <div className="relative mx-auto w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div className="text-primary text-xl">{step.icon}</div>
                      </div>
                      <h3 className="text-sm font-semibold mb-2 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                    </div>
                    {i < auditSteps.length - 1 && (
                      <div className="absolute top-6 -right-2 w-4 h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Process Flow */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {auditSteps.map((step, i) => (
                <div key={i} className="relative">
                  <div className="bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div className="text-primary">{step.icon}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold mb-1 text-foreground">{step.title}</h3>
                        <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                  {i < auditSteps.length - 1 && (
                    <div className="w-0.5 h-4 bg-gradient-to-b from-primary/60 to-primary/20 rounded-full mx-5 my-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-12 px-4 relative z-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-foreground text-center">Frequently Asked Questions</h2>
          <div className="divide-y divide-white/10 bg-black/60 border border-white/10 rounded-xl">
            {faqData.map((item, i) => (
              <div key={item.q}>
                <button
                  className={
                    `w-full flex justify-between items-center p-3 sm:p-4 text-left font-semibold text-primary cursor-pointer focus:outline-none transition-colors text-sm sm:text-base ${openFaq === i ? 'bg-primary/5' : ''}`
                  }
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="pr-4">{item.q}</span>
                  <span className={`ml-4 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-90' : ''}`}>▶</span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 py-2 px-3 sm:px-4' : 'max-h-0 py-0 px-3 sm:px-4'}`}
                  style={{ color: 'var(--tw-prose-body)', background: openFaq === i ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                  aria-hidden={openFaq !== i}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="mx-auto max-w-2xl">
          <Card className="group relative bg-gradient-to-br from-black/80 to-black/40 border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardContent className="p-6 sm:p-8 lg:p-12 relative z-10 text-center">
              {/* Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              
              {/* Main Content */}
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
                Ready to Secure Your Smart Contracts?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                Get started with a free consultation today.
              </p>
              
              {/* Action Button */}
              <button 
                onClick={() => setModalOpen(true)} 
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </section>
      </div>
    </Layout>
  );
} 