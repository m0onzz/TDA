import Link from "next/link";

const LAST_UPDATED = "June 25, 2025";
const CONTACT_EMAIL = "legal@tda.app";

export function TermsOfServiceContent() {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of TDA (TikTok
        Dropship Automator), including our website, dashboard, and related
        services (collectively, the &ldquo;Service&rdquo;). By creating an account
        or using the Service, you agree to these Terms. If you do not agree, do
        not use the Service.
      </p>
      <p>
        See also our{" "}
        <Link href="/privacy" className="legal-link">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>1. What TDA provides</h2>
      <p>
        TDA is a software platform that helps sellers discover products, optimize
        pricing, manage TikTok Shop listings, route orders toward suppliers, and
        receive operational notifications. We provide tools and automation — we
        are not a marketplace, payment processor for your buyers, or the seller of
        record on TikTok Shop.
      </p>
      <p>
        Features may change, be added, or be removed over time. Some capabilities
        depend on third-party services (TikTok Shop, suppliers, Stripe, Discord,
        etc.) that we do not control.
      </p>

      <h2>2. Your account</h2>
      <p>
        You must provide accurate registration information and keep your login
        credentials secure. You are responsible for all activity under your
        account. Notify us promptly if you suspect unauthorized access.
      </p>
      <p>
        You must be at least 18 years old (or the age of majority where you live)
        and able to enter a binding contract to use the Service.
      </p>

      <h2>3. Third-party platforms and compliance</h2>
      <p>
        Using TDA often requires connecting third-party accounts and APIs — for
        example TikTok Shop, dropshipping suppliers, Stripe, and Discord. Your
        use of those services is governed by their own terms and policies.
      </p>
      <p>
        <strong>You are solely responsible</strong> for complying with TikTok Shop
        rules, advertising standards, product listing requirements, tax
        obligations, consumer protection laws, and any supplier or payment
        provider terms that apply to your business. TDA does not guarantee that
        your listings, products, or fulfillment practices will be approved or
        remain compliant on any platform.
      </p>

      <h2>4. API credentials and data you provide</h2>
      <p>
        You may store API keys, access tokens, webhooks, and similar credentials
        in the Service. You represent that you have the right to use those
        credentials and that providing them to TDA does not violate any
        third-party agreement.
      </p>
      <p>
        We encrypt and protect credentials using industry-standard practices, but
        no system is perfectly secure. You accept the risk of storing secrets in
        a cloud service and agree not to hold us liable for unauthorized access
        beyond our reasonable safeguards.
      </p>

      <h2>5. Dropshipping, fulfillment, and payouts</h2>
      <p>
        Product data, supplier availability, shipping times, and costs may be
        inaccurate or change without notice. TDA may simulate or partially
        automate workflows during development; live fulfillment depends on
        suppliers, carriers, and platform APIs working as expected.
      </p>
      <p>
        We target US-warehouse routing and fast shipping workflows, but we do
        not guarantee delivery times, inventory levels, order acceptance, or
        TikTok&rsquo;s 48-hour shipping requirements will be met.
      </p>
      <p>
        If you connect Stripe or other payout tools, payouts are handled by those
        providers under their terms. TDA is not responsible for payout delays,
        holds, chargebacks, or account restrictions imposed by Stripe, TikTok, or
        your bank.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for illegal, fraudulent, or deceptive activity</li>
        <li>List prohibited, counterfeit, or infringing products</li>
        <li>Attempt to bypass security, scrape the Service abusively, or interfere with other users</li>
        <li>Reverse engineer or resell the Service without permission</li>
        <li>Upload malware or abuse notification or webhook endpoints</li>
      </ul>
      <p>
        We may suspend or terminate accounts that violate these rules or pose
        risk to the platform or third parties.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        TDA, its branding, software, and documentation are owned by us or our
        licensors. You receive a limited, non-exclusive license to use the Service
        for your internal business purposes while your account is active and in
        good standing.
      </p>
      <p>
        You retain ownership of content you upload (product data, images, etc.).
        You grant us a license to host, process, and display that content as needed
        to operate the Service.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE.&rdquo;
        TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
        EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE, AND NON-INFRINGEMENT.
      </p>
      <p>
        We do not warrant uninterrupted or error-free operation, specific revenue
        or profit results, successful TikTok listings, or accurate AI-generated
        titles, descriptions, or prices. You are responsible for reviewing
        listings and business decisions before publishing.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, TDA AND ITS OPERATORS WILL NOT BE
        LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM
        YOUR USE OF THE SERVICE.
      </p>
      <p>
        OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE IS LIMITED TO THE
        GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE (12)
        MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100), IF YOU
        HAVE NOT PAID US ANY FEES.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases,
        our liability is limited to the maximum extent permitted by law.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to defend and indemnify TDA and its operators against claims,
        damages, and expenses (including reasonable legal fees) arising from your
        use of the Service, your products, your listings, your breach of these
        Terms, or your violation of any law or third-party rights.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate
        your access if you breach these Terms, if required by law, or if we
        discontinue the Service. Upon termination, your right to use the Service
        ends; provisions that by nature should survive (disclaimers, liability
        limits, indemnity) will survive.
      </p>

      <h2>12. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the revised
        version on this page and update the &ldquo;Last updated&rdquo; date.
        Continued use of the Service after changes become effective constitutes
        acceptance of the updated Terms.
      </p>

      <h2>13. General</h2>
      <p>
        These Terms are the entire agreement between you and TDA regarding the
        Service. If any provision is unenforceable, the rest remains in effect.
        Our failure to enforce a provision is not a waiver. You may not assign
        these Terms without our consent; we may assign them in connection with a
        merger, acquisition, or sale of assets.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
          {CONTACT_EMAIL}
        </a>{" "}
        or return to the{" "}
        <Link href="/" className="legal-link">
          homepage
        </Link>
        .
      </p>
    </>
  );
}
