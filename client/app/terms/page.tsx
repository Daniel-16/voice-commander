"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0A0A0F] flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-50">
          <div className="fixed top-0 -left-32 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-2000"></div>
          <div className="fixed bottom-0 -right-32 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob"></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[64px] animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-[#12121A] p-8 rounded-xl border border-purple-500/20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Terms of Use
            </h2>
          </div>

          <div className="text-gray-400 space-y-6">
            <section>
              <h3 className="text-xl text-white mb-3">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing and using Alris ("Service"), you acknowledge that
                you have read, understood, and agree to be bound by these Terms
                of Use ("Terms"), including any additional guidelines, policies,
                and future modifications. If you do not agree to these Terms in
                their entirety, you must immediately discontinue your use of the
                Service. These Terms constitute a legally binding agreement
                between you and Alris, governing your access to and use of the
                Service, including any associated websites, content,
                functionality, and services offered on or through the Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">2. Use of Service</h3>
              <p>
                You agree to use the Service only for lawful purposes and in
                accordance with these Terms. You are responsible for maintaining
                the confidentiality of your account credentials and for all
                activities that occur under your account. You expressly agree
                not to: (a) use the Service in any way that violates any
                applicable federal, state, local, or international law or
                regulation; (b) impersonate or attempt to impersonate Alris, an
                Alris employee, another user, or any other person or entity; (c)
                engage in any conduct that restricts or inhibits anyone's use or
                enjoyment of the Service; (d) attempt to gain unauthorized
                access to, interfere with, damage, or disrupt any parts of the
                Service, the server on which the Service is stored, or any
                server, computer, or database connected to the Service; (e) use
                any robot, spider, or other automatic device, process, or means
                to access the Service for any purpose, including monitoring or
                copying any of the material on the Service; (f) introduce any
                viruses, Trojan horses, worms, logic bombs, or other material
                that is malicious or technologically harmful.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">3. User Content</h3>
              <p>
                By submitting, posting, or displaying content on or through the
                Service ("User Content"), you grant Alris a worldwide,
                non-exclusive, royalty-free license (with the right to
                sublicense) to use, copy, reproduce, process, adapt, modify,
                publish, transmit, display, and distribute such User Content in
                any and all media or distribution methods now known or later
                developed. You represent and warrant that: (i) you own the User
                Content posted by you or otherwise have the right to grant the
                rights and licenses set forth in these Terms; (ii) the posting
                of your User Content does not violate the privacy rights,
                publicity rights, copyrights, contract rights, intellectual
                property rights, or any other rights of any person or entity;
                and (iii) you agree to pay for all royalties, fees, and any
                other monies owing any person by reason of any User Content you
                post on or through the Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">
                4. Subscription and Payments
              </h3>
              <p>
                We offer various subscription plans for enhanced features and
                services. By selecting a subscription plan, you agree to pay all
                fees associated with the plan you choose. All subscription fees
                are non-refundable and non-transferable except as expressly
                provided in these Terms. Subscription fees are billed in advance
                on a recurring basis, depending on the billing cycle you select.
                You authorize us to charge your chosen payment method for all
                subscription fees incurred. If your payment method fails or your
                account is past due, we reserve the right to either suspend or
                terminate your access to the Service. Prices for the Service are
                subject to change upon 30 days' notice. Such notice may be
                provided at any time by posting the changes to the Alris website
                or via email.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">
                5. Intellectual Property
              </h3>
              <p>
                The Service and its entire contents, features, and functionality
                (including but not limited to all information, software, text,
                displays, images, video, audio, and the design, selection, and
                arrangement thereof) are owned by Alris, its licensors, or other
                providers of such material and are protected by international
                copyright, trademark, patent, trade secret, and other
                intellectual property or proprietary rights laws. These Terms
                permit you to use the Service for your personal, non-commercial
                use only. You must not reproduce, distribute, modify, create
                derivative works of, publicly display, publicly perform,
                republish, download, store, or transmit any of the material on
                our Service, except as generally and ordinarily permitted
                through the Service according to these Terms. You must not
                access or use for any commercial purposes any part of the
                Service or any services or materials available through the
                Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">
                6. Limitation of Liability
              </h3>
              <p>
                To the fullest extent permitted by applicable law, in no event
                shall Alris, its affiliates, employees, licensors, service
                providers, agents, officers, or directors be liable for damages
                of any kind, under any legal theory, arising out of or in
                connection with your use, or inability to use, the Service,
                including any direct, indirect, special, incidental,
                consequential, or punitive damages, including but not limited
                to, personal injury, pain and suffering, emotional distress,
                loss of revenue, loss of profits, loss of business or
                anticipated savings, loss of use, loss of goodwill, loss of
                data, and whether caused by tort (including negligence), breach
                of contract, or otherwise, even if foreseeable. The foregoing
                does not affect any liability that cannot be excluded or limited
                under applicable law. Your sole and exclusive remedy for
                dissatisfaction with the Service is to stop using the Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl text-white mb-3">7. Changes to Terms</h3>
              <p>
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material, we
                will provide at least 30 days' notice prior to any new terms
                taking effect. What constitutes a material change will be
                determined at our sole discretion. By continuing to access or
                use our Service after any revisions become effective, you agree
                to be bound by the revised terms. If you do not agree to the new
                terms, you are no longer authorized to use the Service. We may
                terminate or suspend access to our Service immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if you breach the Terms.
              </p>
            </section>

            <div className="mt-8 text-center">
              <Link href="/" className="text-purple-500 hover:text-purple-400">
                Return to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 30px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 20s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
