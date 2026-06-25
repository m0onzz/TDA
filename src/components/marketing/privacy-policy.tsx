import Link from "next/link";

const LAST_UPDATED = "June 25, 2025";
const CONTACT_EMAIL = "privacy@tda.app";

export function PrivacyPolicyContent() {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <p>
        This Privacy Policy explains how TDA (TikTok Dropship Automator)
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
        uses, and protects information when you use our website, dashboard, and
        related services (the &ldquo;Service&rdquo;). By using the Service, you
        agree to the practices described here. Please also read our{" "}
        <Link href="/terms" className="legal-link">
          Terms of Service
        </Link>
        .
      </p>

      <h2>1. Information we collect</h2>
      <p>We collect information in these main categories:</p>

      <h3>Account information</h3>
      <p>
        When you sign up, we collect your email address and authentication
        details managed through our auth provider. We use this to create your
        account, sign you in, and communicate about the Service.
      </p>

      <h3>Credentials you connect</h3>
      <p>
        If you choose to connect third-party services, we store API keys, access
        tokens, webhook URLs, and similar credentials — for example TikTok Shop,
        dropshipping suppliers, Discord, and Stripe Connect. These secrets are
        encrypted at rest on our servers and are only decrypted when needed to
        perform actions you request (listing products, fulfilling orders,
        sending notifications, or processing payouts).
      </p>
      <p>
        We never expose raw credentials to other users or in client-side code.
      </p>

      <h3>Product and order data</h3>
      <p>
        To operate the Service, we store product catalogs, listing details,
        pricing, images, supplier links, order records, fulfillment status,
        tracking information, and related operational data you import or
        generate through TDA.
      </p>

      <h3>Payment and payout information</h3>
      <p>
        If you connect Stripe Connect for payouts, Stripe collects and processes
        payment and identity information under its own privacy policy. We
        receive limited account identifiers and payout status from Stripe so we
        can show connection state in your dashboard — we do not store full bank
        account numbers.
      </p>

      <h3>Usage and technical data</h3>
      <p>
        Like most web apps, we may collect basic technical information such as
        browser type, device type, IP address, and error logs. We use this to
        keep the Service secure, diagnose problems, and improve reliability.
      </p>

      <h2>2. How we use your information</h2>
      <p>We use the information above to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Authenticate you and secure your account</li>
        <li>Sync products and orders with TikTok Shop and connected suppliers</li>
        <li>Run AI-assisted title, description, and pricing workflows you initiate</li>
        <li>Route fulfillment and send Discord or other notifications you configure</li>
        <li>Facilitate Stripe Connect onboarding and payout status display</li>
        <li>Respond to support requests and enforce our Terms of Service</li>
        <li>Detect abuse, fraud, and security incidents</li>
      </ul>
      <p>
        We do not sell your personal information. We do not use your product or
        order data to train public AI models without your direction through the
        features you use.
      </p>

      <h2>3. Third-party services</h2>
      <p>
        TDA relies on trusted providers to run the platform. They process data
        only as needed to deliver their part of the Service:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database hosting, authentication, and
          encrypted storage for account and application data
        </li>
        <li>
          <strong>Stripe</strong> — Connect onboarding, payouts, and related
          payment infrastructure
        </li>
        <li>
          <strong>TikTok Shop APIs</strong> — listing, order, and shop data
          synchronization when you connect your shop
        </li>
        <li>
          <strong>Supplier APIs</strong> — inventory, pricing, and fulfillment
          when you connect a supported supplier
        </li>
        <li>
          <strong>Discord</strong> — order and operational alerts via webhooks
          you configure
        </li>
        <li>
          <strong>OpenAI</strong> (when enabled) — processing product text you
          submit for AI transformation features
        </li>
      </ul>
      <p>
        Each provider has its own privacy policy and may process data in
        locations outside your country. Your use of those services is also
        subject to their terms.
      </p>

      <h2>4. Cookies and local storage</h2>
      <p>
        We use essential cookies for authentication and session management so you
        can stay signed in securely.
      </p>
      <p>
        We also use browser <strong>localStorage</strong> for non-essential
        preferences on your device, including:
      </p>
      <ul>
        <li>
          <strong>Theme</strong> — your chosen color theme (dark, light, or
          midnight) so the interface loads consistently
        </li>
        <li>
          <strong>Feedback preferences</strong> — sound and haptic settings for
          UI feedback
        </li>
      </ul>
      <p>
        These local values are stored on your device and are not used for
        advertising. You can clear them by clearing site data in your browser;
        theme preferences may also sync to your account when signed in.
      </p>

      <h2>5. Security</h2>
      <p>
        We take reasonable technical and organizational measures to protect your
        information, including:
      </p>
      <ul>
        <li>Encrypting API keys and supplier credentials at rest</li>
        <li>Restricting database access with row-level security policies</li>
        <li>Keeping service-role and encryption keys on the server only</li>
        <li>Validating webhook signatures where supported (e.g. TikTok)</li>
        <li>Using HTTPS for data in transit</li>
      </ul>
      <p>
        No method of transmission or storage is 100% secure. You are responsible
        for keeping your login password confidential and for the credentials you
        choose to store in TDA.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain your account and operational data while your account is active
        and as needed to provide the Service. If you delete connected
        credentials or products, we remove or anonymize that data within a
        reasonable period, subject to backups and legal obligations.
      </p>
      <p>
        If you close your account or request deletion, we will delete or
        anonymize personal information unless we must keep certain records for
        security, fraud prevention, or compliance purposes.
      </p>

      <h2>7. Your rights and choices</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>Access a copy of personal information we hold about you</li>
        <li>Correct inaccurate account information</li>
        <li>Delete your account or specific data</li>
        <li>Disconnect third-party integrations from Settings</li>
        <li>Object to or restrict certain processing</li>
        <li>Export data you have stored in the Service</li>
      </ul>
      <p>
        To make a request, contact us using the details below. We may need to
        verify your identity before responding.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not intended for anyone under 18 (or the age of majority
        in your jurisdiction). We do not knowingly collect personal information
        from children. If you believe a child has provided us data, contact us
        and we will delete it.
      </p>

      <h2>9. International users</h2>
      <p>
        TDA is operated from the United States. If you access the Service from
        outside the U.S., your information may be transferred to, stored in, and
        processed in the U.S. and other countries where our providers operate.
        Those countries may have different data protection laws than your own.
      </p>
      <p>
        Where required, we take steps to ensure appropriate safeguards for
        cross-border transfers.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the
        revised version on this page and update the &ldquo;Last updated&rdquo;
        date. If changes are material, we may also notify you by email or
        through the dashboard. Continued use of the Service after changes take
        effect means you accept the updated policy.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about privacy or data requests? Email{" "}
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
