import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ExternalLink, X } from 'lucide-react';

export default function PoliciesModal({ isOpen, initialSection = 'terms', onClose }) {
  const scrollBoxRef = useRef(null);
  const privacyRef = useRef(null);
  const termsRef = useRef(null);
  const cookiesRef = useRef(null);
  const [activeSection, setActiveSection] = useState(initialSection);

  const jumpToSection = (section, smooth = false) => {
    setActiveSection(section);
    const container = scrollBoxRef.current;
    const target =
      section === 'terms'
        ? termsRef.current
        : section === 'cookies'
        ? cookiesRef.current
        : privacyRef.current;
    if (container && target) {
      const top = target.offsetTop - container.offsetTop - 12;
      container.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveSection(initialSection);
    const raf = requestAnimationFrame(() => {
      jumpToSection(initialSection, false);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, initialSection, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#19154E]/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sa-policies-title"
      onClick={onClose}
    >
      <div
        className="editorial-card bg-white max-w-2xl w-full max-h-[86vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FFF8FC] border-b-2 border-[#19154E] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#19154E]" />
            </span>
            <div>
              <h2 id="sa-policies-title" className="font-display font-bold text-lg text-[#19154E]">
                TechFairyLab & SocialAssist Policies
              </h2>
              <p className="text-[11px] font-bold text-neutral-500">
                Privacy Policy · Terms of Service · Cookie, Disclaimer & Security Policies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/policies.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border-2 border-[#19154E] text-xs font-bold text-[#19154E] hover:bg-[#F5EEFF]"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close policies modal"
              className="p-1.5 rounded-xl bg-white border-2 border-[#19154E] text-[#19154E] hover:bg-[#FFE4F1]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Section Jump Pills */}
        <div className="px-6 py-2.5 bg-[#F5EEFF] border-b-2 border-[#19154E] flex flex-wrap gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => jumpToSection('privacy', true)}
            className={`px-3 py-1 rounded-full border border-[#19154E] transition-colors ${
              activeSection === 'privacy'
                ? 'bg-[#19154E] text-white'
                : 'bg-white text-[#19154E] hover:bg-[#FFE4F1]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => jumpToSection('terms', true)}
            className={`px-3 py-1 rounded-full border border-[#19154E] transition-colors ${
              activeSection === 'terms'
                ? 'bg-[#19154E] text-white'
                : 'bg-white text-[#19154E] hover:bg-[#FFE4F1]'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => jumpToSection('cookies', true)}
            className={`px-3 py-1 rounded-full border border-[#19154E] transition-colors ${
              activeSection === 'cookies'
                ? 'bg-[#19154E] text-white'
                : 'bg-white text-[#19154E] hover:bg-[#FFE4F1]'
            }`}
          >
            Cookie & Security Policies
          </button>
        </div>

        {/* Policy Body (Matches Labfae Policy Package) */}
        <div
          ref={scrollBoxRef}
          className="relative px-6 py-5 overflow-y-auto space-y-6 text-sm leading-relaxed text-neutral-700"
        >
          {/* PRIVACY POLICY */}
          <section ref={privacyRef} className="space-y-3 scroll-mt-4">
            <h3 className="font-display text-xl font-bold text-[#19154E] border-b-2 border-[#FFE4F1] pb-1">
              Privacy Policy
            </h3>
            <p className="text-xs italic text-neutral-500">Last Updated: November 2026</p>
            <p>
              Welcome to TechFairyLab and SocialAssist. Your privacy is important to us. This
              Privacy Policy explains how information is collected, used, and protected when you use
              the TechFairyLab website, SocialAssist studio, and related services.
            </p>
            <p>
              By using TechFairyLab or SocialAssist, you agree to the practices described in this
              Privacy Policy.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              1. Information We Collect
            </h4>
            <p>We may collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name or username (if you create an account)</li>
              <li>Email address</li>
              <li>Account and connected social workspace information (such as Instagram handle)</li>
              <li>Messages, feedback, or support requests</li>
              <li>Any information you voluntarily submit through the website</li>
            </ul>
            <p>We may also automatically collect certain technical information, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address</li>
              <li>Browser type and device information</li>
              <li>Pages visited and website usage statistics</li>
              <li>Error logs and performance data</li>
            </ul>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              2. How We Use Your Information
            </h4>
            <p>TechFairyLab may use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve our services</li>
              <li>Create and manage user accounts and isolated creator workspaces</li>
              <li>Respond to questions and support requests</li>
              <li>Monitor website performance and security</li>
              <li>Detect and prevent misuse or unauthorized access</li>
              <li>Improve user experience</li>
            </ul>
            <p className="font-bold text-[#19154E]">We do not sell your personal information.</p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              3. Cookies and Tracking Technologies
            </h4>
            <p>TechFairyLab may use cookies and local storage technologies to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keep the website and authentication sessions functioning properly</li>
              <li>Remember user preferences and workspace settings</li>
              <li>Understand how visitors use the website and improve performance</li>
            </ul>
            <p>
              You may disable cookies through your browser settings, though some authentication or
              workspace features may not function properly.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              4. Third-Party Services
            </h4>
            <p>
              TechFairyLab may use trusted third-party services that help operate, analyze, or
              secure the website (such as hosting providers, Supabase database/authentication
              providers, Google OAuth, and Instagram/Meta APIs when connected by you). These
              services process limited information according to their own privacy policies.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">5. Data Security</h4>
            <p>
              We take reasonable measures to protect information from unauthorized access, loss,
              misuse, alteration, and disclosure. However, no online service can guarantee complete
              security. Users should protect their account credentials and avoid sharing passwords
              or API tokens.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">6. Data Retention</h4>
            <p>
              We keep information only as long as necessary to provide our services, meet legal
              obligations, resolve disputes, and enforce agreements. When information is no longer
              needed, it may be deleted or anonymized.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">7. Your Rights</h4>
            <p>
              Depending on your location, you may have rights regarding your personal information,
              including requesting access to your data, requesting correction of inaccurate
              information, requesting deletion of your information, and objecting to certain data
              processing activities.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">8. Children&apos;s Privacy</h4>
            <p>
              TechFairyLab and SocialAssist are not intended for children under the age of 13
              without appropriate parental permission. We do not knowingly collect personal
              information from children.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              9. Changes to This Privacy Policy
            </h4>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted here with
              an updated revision date.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              10. Contact Information
            </h4>
            <p>
              TechFairyLab Support — Email:{' '}
              <a
                href="mailto:techfairyanna@gmail.com"
                className="font-bold text-[#19154E] underline"
              >
                techfairyanna@gmail.com
              </a>
            </p>
          </section>

          <hr className="border-dashed border-neutral-300" />

          {/* TERMS OF SERVICE */}
          <section ref={termsRef} className="space-y-3 scroll-mt-4">
            <h3 className="font-display text-xl font-bold text-[#19154E] border-b-2 border-[#FFE4F1] pb-1">
              Terms of Service
            </h3>
            <p className="text-xs italic text-neutral-500">Last Updated: November 2026</p>
            <p>
              Welcome to TechFairyLab and SocialAssist. These Terms of Service explain the rules for
              using our website and services. By accessing or creating an account on SocialAssist,
              you agree to these terms.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">1. Use of Services</h4>
            <p>You agree to use TechFairyLab and SocialAssist only for lawful purposes. You may not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Attempt to gain unauthorized access to accounts or systems</li>
              <li>Damage or interfere with website operations</li>
              <li>Abuse, spam, exploit, or misuse automation or analytics features</li>
              <li>Use the service for illegal activities or platform policy violations</li>
            </ul>

            <h4 className="font-display font-bold text-[#19154E] pt-1">2. User Accounts</h4>
            <p>
              Only registered users who complete sign-up may access SocialAssist workspaces. You are
              responsible for maintaining account security, keeping login information confidential,
              providing accurate information, and all activity performed through your account.
              TechFairyLab may restrict or terminate accounts involved in misuse.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              3. Intellectual Property
            </h4>
            <p>
              All TechFairyLab and SocialAssist content, including website design, branding,
              illustrations, text, graphics, and software, is owned by TechFairyLab or its content
              providers unless otherwise stated. You may not copy, redistribute, modify, or sell
              TechFairyLab content without permission.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">4. User Content</h4>
            <p>
              If you submit content, automation templates, or connected profile handles to
              SocialAssist, you remain responsible for that content and grant TechFairyLab
              permission to process it solely as needed to provide the service. You agree not to
              submit content that violates laws, infringes rights, contains malicious code, or
              harasses others.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              5. Service Availability &amp; Disclaimer
            </h4>
            <p>
              TechFairyLab provides SocialAssist on an &ldquo;as available&rdquo; basis and does not
              guarantee uninterrupted availability or error-free operation. We may modify, suspend,
              or discontinue features at any time.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              6. Limitation of Liability
            </h4>
            <p>
              To the maximum extent allowed by law, TechFairyLab is not responsible for damages
              resulting from use or inability to use the service, website interruptions, third-party
              API changes, loss of data, or unauthorized access outside reasonable control.
            </p>

            <h4 className="font-display font-bold text-[#19154E] pt-1">
              7. Third-Party Links &amp; Changes to Terms
            </h4>
            <p>
              TechFairyLab is not responsible for third-party websites or external platform
              policies. Continued use of the website after updates to these Terms means you accept
              the updated terms.
            </p>
          </section>

          <hr className="border-dashed border-neutral-300" />

          {/* COOKIE, DISCLAIMER & SECURITY POLICIES */}
          <section ref={cookiesRef} className="space-y-3 scroll-mt-4">
            <h3 className="font-display text-xl font-bold text-[#19154E] border-b-2 border-[#FFE4F1] pb-1">
              Cookie, Disclaimer &amp; Security Policies
            </h3>
            <p>
              <strong>Cookie Policy:</strong> We use essential storage/cookies for authentication
              and security, preference storage to remember workspace settings, and basic performance
              diagnostics. You can manage cookies in your browser settings.
            </p>
            <p>
              <strong>Disclaimer Policy:</strong> Analytics insights and growth strategies provided
              by SocialAssist are offered for informational and creator productivity purposes without
              guarantees of specific social media outcomes.
            </p>
            <p>
              <strong>Security Policy:</strong> Users must keep credentials secure, avoid sharing
              passwords, and report any suspected security issues to{' '}
              <a
                href="mailto:techfairyanna@gmail.com"
                className="font-bold text-[#19154E] underline"
              >
                techfairyanna@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Button */}
        <div className="px-6 py-3.5 bg-[#FFF8FC] border-t-2 border-[#19154E] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="editorial-btn px-5 py-2 rounded-xl bg-[#C8F904] text-[#19154E] font-display font-bold text-xs"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
}
