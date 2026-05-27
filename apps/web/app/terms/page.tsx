import { LegalDocument, LegalSection } from "~/components/legal-document";

export default function TermsOfServicePage() {
    return (
        <LegalDocument title="TERMS OF SERVICE" lastUpdated="May 28, 2026">
            <LegalSection title="1. ACCEPTANCE">
                <p>
                    By accessing or using BlockForms (“the Service”), you agree to these Terms of
                    Service. If you do not agree, do not use the Service.
                </p>
            </LegalSection>
            <LegalSection title="2. THE SERVICE">
                <p>
                    BlockForms lets you build forms, publish shareable links, and collect
                    responses. Features and limits may change during beta. We may modify or
                    discontinue parts of the Service with reasonable notice where practicable.
                </p>
            </LegalSection>
            <LegalSection title="3. ACCOUNTS">
                <p>
                    You are responsible for your account credentials and for activity under your
                    account. You must provide accurate information and keep your email verified
                    where required. You must be old enough to form a binding contract in your
                    jurisdiction.
                </p>
            </LegalSection>
            <LegalSection title="4. YOUR CONTENT">
                <p>
                    You retain ownership of forms and data you submit. You grant us a limited
                    license to host, process, and display your content solely to operate the
                    Service. You must not use BlockForms for unlawful, harmful, or abusive
                    purposes, including collecting sensitive data without proper consent and
                    legal basis.
                </p>
            </LegalSection>
            <LegalSection title="5. ACCEPTABLE USE">
                <p>
                    Do not attempt to disrupt the Service, probe systems without authorization,
                    scrape at scale, resell access without permission, or upload malware. We may
                    suspend or terminate accounts that violate these terms.
                </p>
            </LegalSection>
            <LegalSection title="6. DISCLAIMERS">
                <p>
                    The Service is provided “as is” and “as available.” We disclaim warranties to
                    the fullest extent permitted by law, including implied warranties of
                    merchantability, fitness for a particular purpose, and non-infringement.
                </p>
            </LegalSection>
            <LegalSection title="7. LIMITATION OF LIABILITY">
                <p>
                    To the maximum extent permitted by law, BlockForms and its operators are not
                    liable for indirect, incidental, special, consequential, or punitive damages,
                    or for loss of profits, data, or goodwill. Our total liability for any claim
                    relating to the Service is limited to the greater of amounts you paid us in
                    the twelve months before the claim or fifty US dollars.
                </p>
            </LegalSection>
            <LegalSection title="8. CHANGES">
                <p>
                    We may update these Terms. We will post the revised version with an updated
                    date. Continued use after changes constitutes acceptance of the revised Terms.
                </p>
            </LegalSection>
            <LegalSection title="9. CONTACT">
                <p>
                    Questions about these Terms: contact the BlockForms operator through the
                    channels listed on the site or your account correspondence.
                </p>
            </LegalSection>
        </LegalDocument>
    );
}
