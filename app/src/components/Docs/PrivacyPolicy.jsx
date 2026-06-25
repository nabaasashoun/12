// src/components/Docs/PrivacyPolicy.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</p>
          <p className="text-gray-500 text-sm mb-8">Last updated: June 25, 2026</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                Welcome to TrendSync. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="leading-relaxed mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, and other information you choose to add to your profile</li>
                <li><strong>Transaction Information:</strong> Purchase history, product listings, and payment details</li>
                <li><strong>Communication:</strong> Messages, feedback, and correspondence with us or other users</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type, and operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, and time spent on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">We use the information we collect for various purposes:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>To create and manage your account</li>
                <li>To process transactions and send order confirmations</li>
                <li>To provide, maintain, and improve our services</li>
                <li>To communicate with you about updates, promotions, and security alerts</li>
                <li>To personalize your experience and show relevant content</li>
                <li>To detect, prevent, and address technical issues and security risks</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h2>
              <p className="leading-relaxed mb-3">
                We use cookies and similar tracking technologies to collect information about your browsing activities. Cookies help us:
              </p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Deliver relevant advertising and content</li>
                <li>Improve our services based on user behavior</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You can control cookies through your browser settings. However, disabling cookies may affect your experience on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Services</h2>
              <p className="leading-relaxed">
                We may use third-party services for payment processing, analytics, and other functions. These third parties have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
              <p className="leading-relaxed mb-3">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise these rights, please contact us using the information provided in Section 11.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us, and we will take steps to remove that information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">TrendSync Support Team</p>
                <p className="text-gray-600">Email: privacy@trendsync.com</p>
                <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <span>&copy; {new Date().getFullYear()} TrendSync. All rights reserved.</span>
              <div className="flex gap-4">
                <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms & Conditions</Link>
                <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;