<template>
  <div class="pn-page">
    <!-- Top bar -->
    <header class="pn-header">
      <div class="pn-header-inner">
        <img :src="helpitLogo" class="pn-logo" alt="helpIT" />
        <span class="pn-badge">Internal Use Only</span>
      </div>
    </header>

    <!-- Document body -->
    <main class="pn-main">
      <div class="pn-container">
        <!-- Title block -->
        <div class="pn-title-block">
          <p class="pn-eyebrow">Employee Privacy Notice</p>
          <h1 class="pn-title">Data Privacy Notice for helpIT Users</h1>
          <div class="pn-meta">
            <span>Effective Date: <strong>May 25, 2026</strong></span>
            <span class="pn-dot">·</span>
            <span>Version: <strong>1.0</strong></span>
            <span class="pn-dot">·</span>
            <span>Scope: <strong>All Employees</strong></span>
          </div>
          <p class="pn-intro-summary">
            This notice explains how
            <strong>the Company</strong>
            collects, uses, and protects personal
            data processed through the <strong>helpIT</strong> internal helpdesk
            and ticketing system, in compliance with the
            <strong
              >Philippine Data Privacy Act of 2012 (Republic Act No.
              10173)</strong
            >.
          </p>
        </div>

        <!-- Table of contents -->
        <nav class="pn-toc">
          <p class="pn-toc-heading">Contents</p>
          <ol class="pn-toc-list">
            <li><a href="#s1">Introduction</a></li>
            <li><a href="#s2">Personal Data Collected</a></li>
            <li><a href="#s3">Purpose of Collection</a></li>
            <li><a href="#s4">How Your Data Is Used</a></li>
            <li><a href="#s5">Data Retention</a></li>
            <li><a href="#s6">Access Control and Security</a></li>
            <li><a href="#s7">Monitoring and Logging Notice</a></li>
            <li><a href="#s8">Cookies and Session Usage</a></li>
            <li><a href="#s9">Your Rights as a Data Subject</a></li>
            <li><a href="#s10">Data Protection Officer</a></li>
            <li><a href="#s11">Updates to This Notice</a></li>
          </ol>
        </nav>

        <!-- ─── Section 1 ─── -->
        <section id="s1" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">1</span>Introduction
          </h2>
          <p>
            <strong>The Company</strong>
            is committed to protecting the
            privacy and security of personal data processed across all internal
            systems. This notice applies exclusively to the
            <strong>helpIT</strong> internal helpdesk and ticketing system,
            which is accessible only to authorized Company employees in the
          </p>
          <p>
            This notice is issued in compliance with
            <strong>Republic Act No. 10173</strong>, otherwise known as the
            <strong>Data Privacy Act of 2012 (DPA)</strong>, and its
            Implementing Rules and Regulations. It describes what personal data
            helpIT collects, why it is collected, how it is processed, and what
            rights you hold as an employee data subject.
          </p>
          <p>
            This is an internal document and does not apply to any external
            parties, clients, or third-party service providers. By accessing and
            using helpIT as part of your employment, you acknowledge that you
            have read and understood this notice.
          </p>
        </section>

        <!-- ─── Section 2 ─── -->
        <section id="s2" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">2</span>Personal Data Collected
          </h2>
          <p>
            helpIT collects and processes the following personal data in
            connection with your access and use of the system:
          </p>
          <div class="pn-table-wrap">
            <table class="pn-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Examples</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Account Information</strong></td>
                  <td>
                    Full name, company email address, username, department, job
                    role
                  </td>
                </tr>
                <tr>
                  <td><strong>Authentication Data</strong></td>
                  <td>
                    Hashed password, authentication tokens, login timestamps,
                    session identifiers
                  </td>
                </tr>
                <tr>
                  <td><strong>Ticket Content</strong></td>
                  <td>
                    Issue descriptions, support request details, file
                    attachments, ticket categories and priority
                  </td>
                </tr>
                <tr>
                  <td><strong>Activity Logs</strong></td>
                  <td>
                    Login and logout records, IP addresses, browser and device
                    information, actions performed within the system
                  </td>
                </tr>
                <tr>
                  <td><strong>Communication Records</strong></td>
                  <td>
                    Internal comments, technician notes, status updates, and
                    ticket correspondence
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pn-callout pn-callout--info">
            <strong>Note:</strong> helpIT does not deliberately collect
            sensitive personal information as defined under Section 3(l) of the
            DPA (such as health information, government-issued ID numbers, or
            financial details). Employees are advised not to include such data
            in tickets unless it is strictly necessary for the resolution of an
            IT issue, in which case it will be handled with appropriate care.
          </div>
        </section>

        <!-- ─── Section 3 ─── -->
        <section id="s3" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">3</span>Purpose of Collection
          </h2>
          <p>
            Personal data is collected and processed for the following
            legitimate purposes, consistent with Section 12 of the Data Privacy
            Act of 2012:
          </p>
          <ul class="pn-list">
            <li>
              To create, authenticate, and manage your helpIT user account
            </li>
            <li>
              To process, assign, track, and resolve IT service requests and
              incidents
            </li>
            <li>
              To facilitate communication between employees and IT support staff
            </li>
            <li>
              To maintain records of support activities for operational
              accountability and internal audit
            </li>
            <li>
              To generate reports and performance metrics for IT operations
              management
            </li>
            <li>
              To monitor system access and detect unauthorized activity or
              security threats
            </li>
            <li>
              To comply with applicable laws, regulations, and internal Company
              policies
            </li>
          </ul>
          <p>
            Processing is carried out on the basis of: (a) the performance of
            your employment contract, (b) the Company's legitimate
            organizational interests in maintaining secure and functional
            internal systems, and (c) compliance with applicable legal
            obligations under Philippine law.
          </p>
        </section>

        <!-- ─── Section 4 ─── -->
        <section id="s4" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">4</span>How Your Data Is Used
          </h2>
          <p>
            Your personal data is used solely for the purposes described in
            Section 3. More specifically:
          </p>
          <ul class="pn-list">
            <li>
              IT staff (Technicians) access ticket content and account details
              only to the extent necessary to resolve your reported issues.
            </li>
            <li>
              System Administrators access activity logs and system records to
              maintain security, audit compliance, and investigate incidents.
            </li>
            <li>
              IT Managers and authorized administrators may review aggregated or
              de-identified operational reports for resource planning and
              performance monitoring.
            </li>
            <li>
              Personal data is not sold, shared with third parties for
              commercial purposes, or used for any marketing activity.
            </li>
            <li>
              Data may be disclosed to authorized government or regulatory
              bodies if required by applicable law or a valid legal order.
            </li>
          </ul>
          <p>
            Access to personal data within helpIT is strictly role-based and
            limited to what each role requires to perform its designated
            function. Unauthorized access or disclosure is a disciplinary matter
            and may constitute a violation of the Data Privacy Act of 2012.
          </p>
        </section>

        <!-- ─── Section 5 ─── -->
        <section id="s5" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">5</span>Data Retention
          </h2>
          <p>
            Personal data processed by helpIT is retained in line with the
            Company's Data Retention Policy and applicable legal requirements.
            Data is kept only for as long as necessary to fulfill the purposes
            for which it was collected.
          </p>
          <div class="pn-table-wrap">
            <table class="pn-table">
              <thead>
                <tr>
                  <th>Data Type</th>
                  <th>Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Active user account data</td>
                  <td>Duration of employment</td>
                </tr>
                <tr>
                  <td>Ticket records and attachments</td>
                  <td>3 years from date of ticket closure</td>
                </tr>
                <tr>
                  <td>System access and activity logs</td>
                  <td>1 year from date of record creation</td>
                </tr>
                <tr>
                  <td>Deactivated employee accounts</td>
                  <td>Deactivated upon separation; purged after 6 months</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Upon separation from the Company, helpIT accounts are deactivated
            promptly. Personal data retained beyond the employment period is
            kept only to satisfy audit, legal, or regulatory obligations and is
            subject to restricted access during the retention period.
          </p>
        </section>

        <!-- ─── Section 6 ─── -->
        <section id="s6" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">6</span>Access Control and Security
          </h2>
          <p>
            The Company implements appropriate technical and organizational
            security measures to protect personal data from unauthorized access,
            disclosure, alteration, or loss:
          </p>
          <ul class="pn-list">
            <li>
              <strong>Role-based access control (RBAC):</strong> System access
              and data visibility are strictly limited by role — Admin,
              Technician, and User — so that each employee accesses only what
              their function requires.
            </li>
            <li>
              <strong>Password security:</strong> Passwords are stored using
              industry-standard cryptographic hashing. Employees must set a
              strong password and are required to change temporary passwords
              upon first login.
            </li>
            <li>
              <strong>Encrypted transmission:</strong> All data exchanged
              between your browser and the system is transmitted over HTTPS to
              protect against interception.
            </li>
            <li>
              <strong>Secure session management:</strong> Authentication tokens
              are stored in httpOnly, same-site cookies that are not accessible
              from client-side scripts. Sessions expire after inactivity or upon
              logout.
            </li>
            <li>
              <strong>Infrastructure controls:</strong> The system is hosted on
              secure internal infrastructure with access limited to authorized
              IT personnel only.
            </li>
            <li>
              <strong>Audit logging:</strong> System actions are logged to
              support accountability and incident investigation.
            </li>
          </ul>
          <p>
            Employees are responsible for keeping their account credentials
            confidential. Any suspected unauthorized access must be reported to
            the IT Department immediately.
          </p>
        </section>

        <!-- ─── Section 7 ─── -->
        <section id="s7" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">7</span>Monitoring and Logging Notice
          </h2>
          <div class="pn-callout pn-callout--warning">
            <strong>System Monitoring Notice:</strong> All activity within
            helpIT is recorded and may be reviewed by authorized system
            administrators. This monitoring is carried out for security, audit,
            and accountability purposes.
          </div>
          <p>The following events are logged by the system:</p>
          <ul class="pn-list">
            <li>
              User login and logout events, including timestamps and originating
              IP addresses
            </li>
            <li>Failed login attempts and account lockout events</li>
            <li>
              Ticket creation, updates, comments, attachments, and status
              changes
            </li>
            <li>
              Administrative actions, including user account management and
              system configuration
            </li>
          </ul>
          <p>
            Activity logs may be reviewed in connection with security
            investigations, internal audits, dispute resolution, or compliance
            verification. Access to logs is restricted to authorized
            administrators only.
          </p>
          <p>
            Use of this system constitutes acknowledgment of, and implied
            consent to, this monitoring as a condition of employment and access
            to Company IT resources.
          </p>
        </section>

        <!-- ─── Section 8 ─── -->
        <section id="s8" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">8</span>Cookies and Session Usage
          </h2>
          <p>
            helpIT uses only the minimal browser storage mechanisms necessary to
            operate the application securely. No third-party, advertising, or
            analytics cookies are used.
          </p>
          <div class="pn-table-wrap">
            <table class="pn-table">
              <thead>
                <tr>
                  <th>Storage Mechanism</th>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HTTP Cookie (httpOnly)</td>
                  <td><code>token</code></td>
                  <td>
                    Stores your authentication token to maintain your logged-in
                    session. The cookie is httpOnly and same-site strict,
                    meaning it is not accessible from browser scripts and is
                    only sent to the helpIT server.
                  </td>
                  <td>
                    8 hours (standard); 30 days if "Remember Me" is selected
                  </td>
                </tr>
                <tr>
                  <td>Local Storage</td>
                  <td><code>helpit_user</code></td>
                  <td>
                    Stores your basic profile (name, role, email) in the browser
                    to display your account information in the UI without
                    repeated server calls. Contains no authentication secrets.
                  </td>
                  <td>Cleared on logout</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            These storage mechanisms are strictly necessary for helpIT to
            function. They cannot be disabled without preventing access to the
            system. The "Remember Me" option at login extends your session
            cookie to 30 days; leaving it unchecked limits the session to the
            current browser session (8 hours).
          </p>
        </section>

        <!-- ─── Section 9 ─── -->
        <section id="s9" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">9</span>Your Rights as a Data Subject
          </h2>
          <p>
            Under the Data Privacy Act of 2012 (Sections 16–18), you have the
            following rights with respect to your personal data processed by
            helpIT:
          </p>
          <div class="pn-rights-grid">
            <div class="pn-right-card">
              <p class="pn-right-title">Right to be Informed</p>
              <p>
                You have the right to be notified of whether your personal data
                is being collected and processed, and the details of that
                processing — including the purposes, scope, and method.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Access</p>
              <p>
                You may request a copy of the personal data the Company holds
                about you within helpIT, along with information about how it is
                being used.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Rectification</p>
              <p>
                You may request the correction of inaccurate or incomplete
                personal data pertaining to you.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Erasure or Blocking</p>
              <p>
                You may request the deletion or blocking of personal data where
                it is no longer necessary for the original purpose, subject to
                the Company's lawful retention obligations.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Object</p>
              <p>
                You may object to the processing of your personal data where
                processing is not required by law or contract. Legitimate
                objections will be reviewed and acted upon accordingly.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Data Portability</p>
              <p>
                You may request a structured copy of your personal data in a
                commonly used, machine-readable format for your own use.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to Damages</p>
              <p>
                You may claim compensation if you suffer damages arising from
                inaccurate, incomplete, outdated, or unlawfully processed
                personal data.
              </p>
            </div>
            <div class="pn-right-card">
              <p class="pn-right-title">Right to File a Complaint</p>
              <p>
                You may file a complaint with the
                <strong>National Privacy Commission (NPC)</strong> if you
                believe your data privacy rights have been violated. Visit
                <strong>www.privacy.gov.ph</strong> for guidance.
              </p>
            </div>
          </div>
          <p>
            To exercise any of the above rights, submit a written request to the
            Company's IT Department using the contact details in Section 10.
            Requests will be acted upon within
            <strong>fifteen (15) working days</strong> from receipt, as required
            under the DPA.
          </p>
        </section>

        <!-- ─── Section 10 ─── -->
        <section id="s10" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">10</span>Data Protection Officer
          </h2>
          <p>
            The Company has designated the IT Department as the primary contact
            for data privacy matters, responsible for coordinating compliance
            with the Data Privacy Act of 2012. For any privacy-related
            inquiries, data subject requests, or concerns regarding helpIT,
            please contact:
          </p>
          <div class="pn-dpo-card">
            <p class="pn-dpo-company">Your Organization</p>
            <p class="pn-dpo-role">IT Department — Data Privacy Contact</p>
            <div class="pn-dpo-details">
              <div class="pn-dpo-row">
                <span class="pn-dpo-label">Contact</span>
                <span>IT Department</span>
              </div>
              <div class="pn-dpo-row">
                <span class="pn-dpo-label">Email</span>
                <span
                  ><a href="mailto:it-helpdesk@your-organization.com"
                    >it-helpdesk@your-organization.com</a
                  ></span
                >
              </div>
              <div class="pn-dpo-row">
                <span class="pn-dpo-label">Address</span>
                <span>[Your Organization's Address]</span>
              </div>
              <div class="pn-dpo-row">
                <span class="pn-dpo-label">Office Hours</span>
                <span>Monday – Friday, 8:00 AM – 5:00 PM</span>
              </div>
            </div>
          </div>
          <p>
            All requests will be acknowledged and acted upon within fifteen (15)
            working days from receipt. The IT Department may request reasonable
            proof of identity before processing a data subject request.
          </p>
        </section>

        <!-- ─── Section 11 ─── -->
        <section id="s11" class="pn-section">
          <h2 class="pn-section-heading">
            <span class="pn-num">11</span>Updates to This Notice
          </h2>
          <p>
            This Privacy Notice may be revised periodically to reflect changes
            in applicable law, National Privacy Commission issuances, Company
            policy, or the features and capabilities of the helpIT system.
          </p>
          <p>
            When material changes are made, employees will be notified through
            official Company communications or via a notice within the helpIT
            system. The effective date at the top of this document reflects the
            version currently in force.
          </p>
          <p>
            Continued use of helpIT following notification of any updates
            constitutes acknowledgment of the revised notice. Prior versions of
            this notice are available from the Data Protection Officer upon
            written request.
          </p>
        </section>
      </div>
      <!-- /pn-container -->
    </main>

    <!-- Footer -->
    <footer class="pn-footer">
      <div class="pn-footer-inner">
        <span>For authorized company use only.</span>
        <span>© {{ year }} helpIT. All rights reserved.</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import helpitLogo from "@/assets/helpit_logo.png";
const year = new Date().getFullYear();
</script>

<style scoped>
/* ── Page shell ── */
.pn-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f4f8;
  font-family: "Roboto", sans-serif;
  color: rgba(0, 0, 0, 0.87);
}

/* ── Header ── */
.pn-header {
  background: #002d72;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}
.pn-header-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.pn-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.pn-badge {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 3px 10px;
  border-radius: 2px;
}

/* ── Main content ── */
.pn-main {
  flex: 1;
  padding: 40px 24px 64px;
}
.pn-container {
  max-width: 900px;
  margin: 0 auto;
}

/* ── Title block ── */
.pn-title-block {
  background: #fff;
  border-radius: 2px;
  padding: 40px 48px;
  margin-bottom: 24px;
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.14),
    0 1px 5px rgba(0, 0, 0, 0.12);
  border-top: 4px solid #002d72;
}
.pn-eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fd6300;
  margin-bottom: 8px;
}
.pn-title {
  font-size: 28px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
  line-height: 1.3;
}
.pn-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.pn-dot {
  color: rgba(0, 0, 0, 0.26);
}
.pn-intro-summary {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.7);
  margin: 0;
}

/* ── Table of contents ── */
.pn-toc {
  background: #fff;
  border-radius: 2px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border-left: 4px solid #002d72;
}
.pn-toc-heading {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.54);
  margin-bottom: 12px;
}
.pn-toc-list {
  margin: 0;
  padding-left: 20px;
  columns: 2;
  column-gap: 32px;
}
.pn-toc-list li {
  margin-bottom: 6px;
  break-inside: avoid;
}
.pn-toc-list a {
  font-size: 13px;
  color: #002d72;
  text-decoration: none;
  line-height: 1.5;
}
.pn-toc-list a:hover {
  text-decoration: underline;
}

/* ── Sections ── */
.pn-section {
  background: #fff;
  border-radius: 2px;
  padding: 36px 48px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.pn-section p {
  font-size: 14px;
  line-height: 1.75;
  color: rgba(0, 0, 0, 0.8);
  margin: 0 0 16px;
}
.pn-section p:last-child {
  margin-bottom: 0;
}

/* ── Section headings ── */
.pn-section-heading {
  font-size: 18px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.pn-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #002d72;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

/* ── Lists ── */
.pn-list {
  margin: 12px 0 16px;
  padding-left: 20px;
}
.pn-list li {
  font-size: 14px;
  line-height: 1.75;
  color: rgba(0, 0, 0, 0.8);
  margin-bottom: 8px;
}
.pn-list li:last-child {
  margin-bottom: 0;
}

/* ── Tables ── */
.pn-table-wrap {
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 2px;
}
.pn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.pn-table th {
  background: #f5f7fa;
  color: rgba(0, 0, 0, 0.54);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}
.pn-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.8);
  vertical-align: top;
  line-height: 1.6;
}
.pn-table tbody tr:last-child td {
  border-bottom: none;
}
.pn-table tbody tr:hover td {
  background: rgba(0, 45, 114, 0.03);
}
.pn-table code {
  font-family: "Roboto Mono", "Courier New", monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 5px;
  border-radius: 2px;
  color: rgba(0, 0, 0, 0.7);
}

/* ── Callouts ── */
.pn-callout {
  border-radius: 2px;
  padding: 14px 18px;
  font-size: 13px;
  line-height: 1.65;
  margin: 16px 0;
}
.pn-callout--info {
  background: #e8f0fd;
  border-left: 4px solid #002d72;
  color: rgba(0, 0, 0, 0.75);
}
.pn-callout--warning {
  background: #fff8e1;
  border-left: 4px solid #fd6300;
  color: rgba(0, 0, 0, 0.75);
}

/* ── Rights grid ── */
.pn-rights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px 0;
}
.pn-right-card {
  background: #f5f7fa;
  border-radius: 2px;
  padding: 16px 20px;
  border-top: 3px solid #002d72;
}
.pn-right-title {
  font-size: 13px;
  font-weight: 500;
  color: #002d72;
  margin: 0 0 8px !important;
}
.pn-right-card p:not(.pn-right-title) {
  font-size: 13px !important;
  line-height: 1.6 !important;
  color: rgba(0, 0, 0, 0.7) !important;
  margin: 0 !important;
}

/* ── DPO card ── */
.pn-dpo-card {
  background: #f5f7fa;
  border-radius: 2px;
  border-left: 4px solid #002d72;
  padding: 24px 28px;
  margin: 20px 0;
}
.pn-dpo-company {
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 2px !important;
}
.pn-dpo-role {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fd6300;
  margin: 0 0 16px !important;
}
.pn-dpo-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pn-dpo-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.8);
}
.pn-dpo-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.54);
  min-width: 90px;
  flex-shrink: 0;
}
.pn-dpo-row a {
  color: #002d72;
  text-decoration: none;
}
.pn-dpo-row a:hover {
  text-decoration: underline;
}

/* ── Footer ── */
.pn-footer {
  background: #002d72;
  color: rgba(255, 255, 255, 0.6);
  padding: 18px 24px;
  margin-top: auto;
}
.pn-footer-inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  gap: 16px;
  flex-wrap: wrap;
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .pn-title-block,
  .pn-section {
    padding: 24px 20px;
  }
  .pn-toc {
    padding: 20px 20px;
  }
  .pn-toc-list {
    columns: 1;
  }
  .pn-rights-grid {
    grid-template-columns: 1fr;
  }
  .pn-title {
    font-size: 22px;
  }
  .pn-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .pn-dot {
    display: none;
  }
  .pn-footer-inner {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>
