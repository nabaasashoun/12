// src/components/Docs/Terms&Conditions.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const TermsConditions = () => {
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
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</p>
          <p className="text-gray-500 text-sm mb-8">Last updated: June 25, 2026</p>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing or using TrendSync ("we," "our," or "us"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform. These terms constitute a legally binding agreement between you and TrendSync.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
              <p className="leading-relaxed mb-3">To use certain features of our platform, you must create an account. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
                <li>Not share your account with others or create multiple accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Roles</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Buyers</h3>
                  <p className="leading-relaxed">
                    Buyers can browse, search, and purchase products on the platform. You agree to provide accurate payment information and comply with all applicable laws when making purchases.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Sellers</h3>
                  <p className="leading-relaxed">
                    Sellers can list, manage, and sell products on the platform. You agree to provide accurate product information, fulfill orders promptly, and comply with all applicable laws and regulations regarding the sale of your products.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Product Listings and Sales</h2>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>You must have the legal right to sell any products you list on our platform</li>
                <li>Product descriptions must be accurate and not misleading</li>
                <li>You are responsible for pricing, shipping, and customer service for your products</li>
                <li>We reserve the right to remove any product listing that violates these terms</li>
                <li>All sales are final unless otherwise specified in our return policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Prohibited Activities</h2>
              <p className="leading-relaxed mb-3">You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>Fraudulent, illegal, or unauthorized activities</li>
                <li>Harassment, abuse, or harm to others</li>
                <li>Infringement of intellectual property rights</li>
                <li>Distribution of malware, viruses, or harmful code</li>
                <li>Attempting to bypass our security measures</li>
                <li>Collecting user data without authorization</li>
                <li>Impersonating another person or entity</li>
                <li>Using automated systems to access the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p className="leading-relaxed">
                All content on TrendSync, including text, graphics, logos, images, and software, is the property of TrendSync or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Payment and Fees</h2>
              <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                <li>Buyers agree to pay all applicable fees for purchases made through our platform</li>
                <li>Sellers agree to pay any applicable service fees or commissions</li>
                <li>All fees are non-refundable unless otherwise specified</li>
                <li>We may change our fee structure with prior notice</li>
                <li>Payment processing is handled by third-party payment processors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Returns and Refunds</h2>
              <p className="leading-relaxed">
                Returns and refunds are subject to our return policy. Buyers must contact sellers directly for return inquiries. Sellers are responsible for establishing and communicating their own return policies. In cases of dispute, we reserve the right to mediate and make final decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, for any violation of these Terms and Conditions. Upon termination, your right to use the platform will immediately cease, and we may remove your content from the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                Our platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components. We make no warranty regarding the quality, safety, or legality of products sold on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the fullest extent permitted by law, TrendSync shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the platform. Our total liability shall not exceed the amount paid by you to us in the previous 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold TrendSync harmless from any claims, damages, losses, or expenses arising from your use of the platform, violation of these terms, or infringement of any rights of third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions. Any legal action arising from these terms shall be brought in the courts located in [Your City/Region].
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to update or modify these Terms and Conditions at any time without prior notice. Any changes will be effective immediately upon posting. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">TrendSync Support Team</p>
                <p className="text-gray-600">Email: legal@trendsync.com</p>
                <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
                <p className="text-gray-600">Address: 123 Trend Street, Digital City, DC 12345</p>
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

export default TermsConditions;