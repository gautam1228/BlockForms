import { LegalDocument, LegalSection } from "~/components/legal-document";

export default function PrivacyPolicyPage() {
    return (
        <LegalDocument title="PRIVACY POLICY" lastUpdated="May 28, 2026">
            <LegalSection title="1. OVERVIEW">
                <p>
                    This Privacy Policy explains how BlockForms (“we,” “us”) collects, uses, and
                    shares information when you use our website and form-building service.
                </p>
            </LegalSection>
            <LegalSection title="2. INFORMATION WE COLLECT">
                <p>
                    <strong className="text-foreground">Account data:</strong> name, email, password
                    (stored hashed), profile preferences, and authentication tokens.
                </p>
                <p>
                    <strong className="text-foreground">Form data:</strong> forms you create,
                    settings, themes, and responses submitted by respondents (including any fields
                    they fill in).
                </p>
                <p>
                    <strong className="text-foreground">Usage data:</strong> logs, device/browser
                    type, IP address, and actions needed to secure and operate the Service.
                </p>
            </LegalSection>
            <LegalSection title="3. HOW WE USE INFORMATION">
                <p>
                    We use information to provide and improve the Service, authenticate users,
                    send transactional email (such as verification and password reset), prevent
                    abuse, comply with law, and support you when you contact us.
                </p>
            </LegalSection>
            <LegalSection title="4. SHARING">
                <p>
                    We do not sell your personal information. We may share data with infrastructure
                    providers (hosting, email) that process it on our behalf under contractual
                    obligations, or when required by law or to protect rights and safety.
                </p>
            </LegalSection>
            <LegalSection title="5. COOKIES & LOCAL STORAGE">
                <p>
                    We use cookies and similar technologies for session authentication, security,
                    and preferences (for example, music and UI settings stored in your browser).
                    You can control cookies through browser settings; some features may not work
                    without them.
                </p>
            </LegalSection>
            <LegalSection title="6. RETENTION">
                <p>
                    We retain account and form data while your account is active and as needed for
                    legal, security, and backup purposes. You may request deletion of your account;
                    some data may persist in backups for a limited period.
                </p>
            </LegalSection>
            <LegalSection title="7. SECURITY">
                <p>
                    We use industry-standard measures such as HTTPS, hashed passwords, and access
                    controls. No method of transmission or storage is completely secure.
                </p>
            </LegalSection>
            <LegalSection title="8. YOUR RIGHTS">
                <p>
                    Depending on your location, you may have rights to access, correct, delete, or
                    export personal data, or to object to certain processing. Contact us to exercise
                    these rights.
                </p>
            </LegalSection>
            <LegalSection title="9. CHILDREN">
                <p>
                    The Service is not directed at children under 13 (or the minimum age in your
                    region). We do not knowingly collect data from children.
                </p>
            </LegalSection>
            <LegalSection title="10. CHANGES">
                <p>
                    We may update this Policy. We will post the revised version with an updated
                    date. Material changes may be communicated by email or in-product notice where
                    appropriate.
                </p>
            </LegalSection>
            <LegalSection title="11. CONTACT">
                <p>
                    Privacy questions: contact the BlockForms operator through the channels listed
                    on the site.
                </p>
            </LegalSection>
        </LegalDocument>
    );
}
