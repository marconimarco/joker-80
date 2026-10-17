export interface LegalSection {
  id: 'nda' | 'eula' | 'disclaimer' | 'privacy';
  title: string;
  badge: string;
  shortDesc: string;
  content: string;
}

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: 'nda',
    title: '# 1 NON-DISCLOSURE AGREEMENT (NDA)',
    badge: 'Confidenzialità & AI Processing',
    shortDesc: 'Accordo di non divulgazione, tracciabilità blockchain e divieto di ritenzione dati.',
    content: `Art. 1 - Subject and Definitions
"Confidential Information" refers to all technical, operational, methodological, and commercial information related to the [Product Name] Dashboard, including but not limited to: source code, database architecture, filtering logic, document templates, workflows, algorithms, and data update strategies.

Art. 2 - Confidentiality Obligations and Exclusive Use
The User agrees to:
a) Maintain absolute secrecy regarding the Confidential Information.
b) Use the extracted materials exclusively for the internal needs of the subscribing company. Sharing with third parties, subsidiaries, or affiliates without written authorization is strictly prohibited.
c) Be held liable for the actions of employees or collaborators who have access to the Dashboard.

Art. 3 - Blockchain Traceability
The User acknowledges that Confidential Information and downloaded documents are protected via Blockchain Timestamping technology. This digital marking constitutes immutable proof of data ownership and the source of origin in the event of unauthorized distribution.

Art. 4 - Violations and Damages
In the event of a breach, the Owner reserves the right to seek full compensation for damages (actual loss and loss of profit). The amount of compensation will be assessed based on:
The severity of the breach and the User's intent;
The geographical origin of the defaulting company;
The legal and protection costs required in the relevant foreign jurisdiction.

Art. 5 - Duration
Confidentiality obligations shall survive for a period of 3 (three) years following the termination of the relationship.

Art. 6 - Zero Data Retention and Third-Party AI Processing
The Provider guarantees a strict "Absolute Zero Data Retention" policy on the server side: the infrastructure does not store, record, index, or retain any corporate data or documents loaded by the User. The application operates entirely within the User's web browser as a volatile transit channel. The User expressly authorizes the temporary and encrypted transit (HTTPS / TLS 1.3) of text to the official Google AI Studio API for Gemini model processing. The Provider guarantees that, within the enabled commercial/paid tier, such data is protected by Google’s Enterprise policies and is never used to train, improve, or fine-tune general large language models.`
  },
  {
    id: 'eula',
    title: '# 2 END-USER LICENSE AGREEMENT (EULA)',
    badge: 'Licenza d\'Uso Software',
    shortDesc: 'Concessione di licenza, copyright, divieti specifici e architettura client-side.',
    content: `Art. 1 - Grant of License
The Owner grants a limited, non-exclusive, and non-transferable license to access the Dashboard and use the regulatory templates. The license is strictly tied to the purchasing company and cannot be sub-licensed.

Art. 2 - Intellectual Property and Copyright
The software and data organization are protected by Italian Law 633/1941 and international copyright treaties. This license does not transfer any intellectual property rights regarding the original templates.

Art. 3 - Specific Prohibitions and Abuse
The User is strictly prohibited from:
a) Performing Reverse Engineering or massive scraping via scripts/bots.
b) Using the data for the training of Artificial Intelligence systems.
c) Reselling or distributing the templates to third parties outside of the internal professional use of the licensee company.

Art. 4 - Blockchain Certification and Traceability
Downloadable material is not encrypted to facilitate usability, but it is registered under license via Blockchain Timestamping. The User accepts that such registration shall be used as definitive and irrefutable evidence in legal proceedings to verify the identity of the downloader and the integrity of the document.

Art. 5 - Limitation of Liability (Disclaimer)
The service is provided "as is". The Owner does not guarantee the legal outcome of actions based on the provided documents; the responsibility for adapting such documents lies exclusively with the User. The Owner is not liable for sudden regulatory changes.

Art. 6 - Suspension and Termination
The Owner may suspend access in the event of anomalous download patterns or simultaneous multiple logins that suggest a license violation or attempted data theft.

Art. 7 - Governing Law and Jurisdiction
This agreement is governed by Italian law. For any dispute, the Court of [Your City] shall have jurisdiction. For companies based outside the European Union, the Owner reserves the right to take legal action before the competent courts at the defendant's place of business to protect its rights and recover legal fees.

Art. 8 - Client-Side Architecture and Local Storage Responsibility
The User acknowledges and agrees that the Application runs entirely within their web browser. All loaded documents, text inputs, and modifications reside exclusively in the temporary local memory of the User's device (session RAM). The Provider does not own any storage database for documents and does not maintain backup copies. It is the User's sole and absolute responsibility to download the updated file to their PC before closing the browser tab or ending the session. Any accidental closure, network disconnection, cache clearing, or failure to download will result in the immediate and irreversible loss of all work, with no possibility of recovery by the Provider. The physical and logical security of the downloaded file on the local PC remains entirely at the User's own risk and expense. In no event shall the Provider be liable for administrative sanctions, missing ISO certifications, or economic damages, with a maximum liability capped at the amount paid by the User over the preceding 12 months.`
  },
  {
    id: 'disclaimer',
    title: '# 3 DISCLAIMER & GENERAL TERMS (ART. 1 - 89)',
    badge: 'Termini Generali & 89 Articoli',
    shortDesc: 'Termini contrattuali globali, limitazioni di responsabilità ed esonero AI.',
    content: `Last Updated: June 2026

SECTION I: SCOPE, DEFINITIONS, AND UNIVERSAL NATURE OF THE AGREEMENT
Art. 1 - Global and Extraterritorial Scope
These General Terms and Conditions govern the cross-border access and use of the platform on a global scale, binding the User regardless of their country of establishment, nationality, citizenship, or local jurisdiction.

Art. 2 - Conventional Identification of the Provider
"Provider" refers to the international corporate entity that owns and licenses the platform, comprehensively including its founders, developers, shareholders, directors, employees, external collaborators, global subsidiaries, and successors.

Art. 3 - Definition of User and B2B Tenant
"User" or "Tenant" refers to any legal entity, business, multinational corporation, public body, professional, or consultant subscribing to the service for purposes strictly related to their economic, industrial, or professional activity.

Art. 4 - Computational Nature of the Software
The software is exclusively an IT tool based on third-party artificial intelligence statistical models, designed to generate unverified automated text drafts. The software does not provide professional consulting services.

Art. 5 - Unilateral and Instantaneous Modification of Terms
The Provider reserves the absolute right to update, amend, or replace any of these 88 articles at any time due to global technical or regulatory shifts. Continued use of the platform constitutes implicit acceptance.

Art. 6 - Execution of the Cross-Border Electronic Agreement
The contract is deemed executed and fully effective between the parties internationally at the exact moment the User selects the acceptance checkbox and transmits the electronic registration impulse to the servers.

Art. 7 - International Registration and Identification Requirements
The User is solely responsible for the authenticity of the data provided, including international tax codes, corporate registration numbers (e.g., VAT, EIN, LEI, Business ID), and the geographic location of their primary registered office.

Art. 8 - Prohibition of Account Sharing and Impersonalization
User licenses and access credentials are strictly for the internal organization of the Tenant and its registered sub-users. Reselling or temporarily transferring accounts to unauthorized third parties is prohibited.

Art. 9 - Custody and Strict Liability for Access Credentials
The Tenant is strictly, automatically, and unlimitedly liable for any operations, data extractions, or text generations performed using its authentication credentials or API keys.

Art. 10 - Burden of Connectivity and Infrastructure Compatibility
The User bears sole responsibility for adapting their IT systems, browsers, networks, and internet protocols required to properly receive the platform's output anywhere in the world.

SECTION II: ACCEPTANCE OF TECHNOLOGICAL RISK AND GLOBAL INDEMNITIES
Art. 11 - Global "As Is" and "As Available" Clause
The service is provided and accepted on an "as is" and "as available" basis, without any implicit or explicit warranties of continuity, merchantability, absence of defects, or fitness for specific national or regional markets.

Art. 12 - Acknowledgement of AI Probabilistic Nature
The User accepts that all generated responses and texts derive from predictive language models and non-deterministic algorithmic logic, structured through probabilistic word association rather than factual verification.

Art. 13 - Exclusion of Legal Accuracy Warranties
The Provider makes no representations or warranties regarding the accuracy, legal compliance, updating, or formal validity of the texts relative to the changing local or international regulations across different global states.

Art. 14 - Awareness of Algorithmic "Hallucination" Risks
The User acknowledges the technical possibility that the AI may generate fabricated data, non-existent regulations, or false ISO references, and assumes all financial and operational risks associated with such inaccuracies.

Art. 15 - Mandatory Human-in-the-Loop Validation Obligation
It is an essential, binding, and irreplaceable condition of this contract that the User subjects every single output, draft, paragraph, or template generated by the platform to analytical review, correction, and formal approval by a qualified human auditor, professional consultant, or third-party Certification Body.

Art. 16 - Absolute Prohibition of Direct Implementation
It is strictly prohibited worldwide to use, deploy, internally distribute, or present raw text outputs to regulatory inspection bodies exactly as exported from the platform without the human validation specified in Art. 15.

Art. 17 - Total Exclusion of Liability for Direct Damages
Under no circumstances and in no jurisdiction shall the Provider be liable for any material, direct, or proximate damages incurred by the User or its clients resulting from the adoption of or reliance on the generated texts.

Art. 18 - Imperative Exclusion of Indirect Damages
The Provider excludes any liability for indirect, incidental, consequential, financial, or punitive damages, including but not limited to loss of profits, commercial contracts, revenue, or business interruption.

Art. 19 - Exclusion for Failed Audits or ISO Revocations
The Provider shall not be liable for any denial of certification, document rejection, suspension, or revocation of ISO compliance by any international Registrar, Body, or Lead Auditor.

Art. 20 - Exclusion for Administrative or Governmental Sanctions
The Provider is not liable for financial penalties, criminal or civil fines, or administrative sanctions imposed on the User by public authorities, ministries, or regulatory bodies of any country due to deficiencies in their management systems.

Art. 21 - Exclusion of Liability for Reputational Damage
No compensation or indemnity is owed by the Provider for loss of brand image, commercial de-indexing, boycotts, or damage to corporate reputation resulting from the use of flawed procedures.

Art. 22 - Global Liability Cap Clause (Limited to €100)
Save for what is mandatorily required by unalterable rules of international public order, the Provider's total aggregate liability for any breach, tort, or negligence is strictly capped at a maximum ceiling of €100 (one hundred euros).

Art. 23 - Exclusion of Liability for User-Inserted Inputs
The User holds exclusive liability for all contents, data, codes of conduct, or internal information inserted into the prompts, indemnifying the Provider against any sanctions resulting from illegal or misleading inputs.

Art. 24 - Structural Dependency on Third-Party Cloud and Data Centers
The User acknowledges that SaaS delivery depends on the connectivity, computing infrastructure, and APIs of international third parties. The Provider is not liable for systemic outages caused by these external industrial nodes.

Art. 25 - Scheduled Downtime for Global Maintenance
The Provider retains the right to temporarily deactivate global servers for routine maintenance or software updates, excluding any user rights to refunds for temporary service unavailability.

Art. 26 - Emergency Suspension for Security Threats
In the event of zero-day exploits, cyberattacks, or network anomalies, the Provider may block access to the software worldwide immediately and for as long as necessary to restore infrastructure security.

Art. 27 - Exclusion for Massive Cyberattacks (DDoS, Ransomware)
The Provider is not liable for data loss or service interruptions resulting from hostile third-party actions, cyber warfare, organized hacker attacks, malware injections, or Distributed Denial of Service attacks.

Art. 28 - Force Majeure and Geopolitical Instability Exemption
The Provider is released from any performance obligations in the event of wars, armed conflicts, international embargoes, trade blocks, nationalizations, global pandemics, or continent-scale power grid failures.

Art. 29 - Prohibition of Using Generated Texts as Evidence Against the Provider
The generated texts and platform responses may not be used by the User, their legal counsel, or intermediaries in court to prove non-performance or code defectiveness on the part of the Provider.

Art. 30 - Universal Statute of Limitations (6 Months)
Any action, claim, or demand arising out of or related to this contract must be brought by the User, under penalty of absolute forfeiture, within 6 (six) months from the day of the disputed computational generation.

SECTION III: INTELLECTUAL PROPERTY, REVERSE ENGINEERING, AND TRADE SECRETS
Art. 31 - Exclusive Global Intellectual Property of the Software
The source code, user interface (UI/UX), routing algorithms, database structures, and logical components of the platform remain the exclusive international property of the Provider.

Art. 32 - Absolute Prohibition of Reverse Engineering
The User is expressly forbidden, in any state or territory worldwide, from decompiling, disassembling, mapping, proxy-tracing, or analyzing the SaaS application code and internal API calls.

Art. 33 - Protection of System Prompts and Latent Logic
System prompts, conditional instructions supplied to the AI, and proprietary ISO taxonomies utilized constitute inalienable trade and industrial secrets of the Provider, protected globally.

Art. 34 - Prohibition of Prompt Injection Attacks
The insertion of commands designed to bypass application guardrails to force the extraction, copying, visualization, or storage of the platform's core system instructions is strictly prohibited.

Art. 35 - Conditional Ownership of Extracted Outputs
The User acquires ownership of the raw text outputs resulting from their computing sessions, subject to the strict prohibition against utilizing them in manners that constitute cross-border unfair competition.

Art. 36 - Prohibition of Using Outputs for Competitive Model Training
The User is absolutely prohibited from using the generated texts, extracted taxonomies, or platform logic structures to train, optimize, test, or validate competing proprietary artificial intelligence models.

Art. 37 - International Trademark and Logo Protection
The User acquires no rights over the Provider’s trademarks, trade names, logos, or graphic signs. Any commercial or promotional use of these assets requires prior written consent.

Art. 38 - Exclusive Liability for User-Immitted Trade Secrets
The User assumes all legal and commercial liability resulting from the inclusion of confidential business data, industrial secrets, or information protected by Non-Disclosure Agreements (NDAs) within their prompts.

Art. 39 - Indemnity for Involuntary Algorithmic Text Similarities
Given the statistical nature of AI architectures, the User exemptes the Provider from any copyright infringement claims should the output present partial similarities to pre-existing web content.

Art. 40 - Precarious and Temporary Nature of the User License
The usage license granted is non-exclusive, revocable, non-transferable, and strictly limited to the specific temporal duration of the subscription tier paid by the Tenant.

SECTION IV: MULTI-TENANCY STRUCTURE AND COOPERATIVE ACCOUNT MANAGEMENT
Art. 41 - Logical Isolation of Tenant Architecture
The platform delivers services via a multi-tenant structure, wherein the operational data and configurations of each customer are logically segregated at the database level from other users.

Art. 42 - Rights and Duties of the Tenant Administrator (Admin)
The user designated as the workspace administrator holds full operational responsibility for invitations, role configurations, privilege assignments, and the revocation of associated sub-accounts.

Art. 43 - Cascading Extension of Contractual Obligations to Sub-Users
The primary Tenant guarantees and is liable for the explicit acceptance and adherence to these 88 articles by every operator, employee, or external consultant operating under its licenses.

Art. 44 - Strict and Joint Liability of the Primary Tenant
The primary Tenant is jointly, directly, and strictly liable for any contractual breaches, API abuses, or cyber offenses committed by its individual sub-accounts.

Art. 45 - Software Lock for Unverified Sub-Accounts
The platform will systematically block onboarding and operational access for any sub-user until an explicit opt-in and consent log regarding these Terms is registered in the database.

Art. 46 - Evidentiary Autonomy of Multi-Tenant Acceptance Logs
The system database logs the IP address, user-agent string, and timestamp of every sub-user independently, consolidating the chain of corporate indemnities.

Art. 47 - International Prohibition of Sub-Licensing or Business Transfer
The Tenant may not assign, alienate, lease, lend, or sub-license its workspace or computing environment to third-party legal entities, external branches, or subsidiaries.

Art. 48 - Anti-Abuse Shared Resource Limitation Logic
To preserve the integrity of the multi-tenant SaaS environment, the Provider may rate-limit or suspend accounts exhibiting anomalous concurrent processing volumes.

Art. 49 - Database Logical Data Isolation Clause
While the Provider applies strict logical isolation of tenants within the database, it is not liable for data breaches resulting from User negligence in managing their unique tokens or passwords.

Art. 50 - Immediate Termination for Tenant Insolvency or Non-Payment
Failure to settle subscription fees within the agreed timelines will result in the immediate suspension and subsequent deletion of the Tenant profile and all associated sub-accounts.

SECTION V: CROSS-BORDER DATA FLOWS, PRIVACY COMPLIANCE, AND SENSITIVE DATA EXCLUSION
Art. 51 - Global and Cross-Border Cloud Architecture
The software architecture operates utilizing international servers and data centers distributed across multiple continents and regions based on the Provider's logistical requirements.

Art. 52 - Irrevocable Authorization for Multinational Data Transfers
The User grants definitive, unconditional consent for operational data, technical logs, and prompts to be transferred and processed outside their country of origin or use.

Art. 53 - Contractual Privacy Roles (Processor/Controller)
The Provider acts strictly as a Data Processor for the data entered, while the Tenant assumes the exclusive classification and legal obligations of a Data Controller.

Art. 54 - Global Privacy Law Compliance
The parties pledge to respect, within their respective operational boundaries, all global and supranational regulations applicable to corporate data protection.

Art. 55 - Absolute Prohibition on Inserting Sensitive or Protected Data
The User is strictly prohibited from entering health, biometric, judicial, political, or personal data subject to special national protection frameworks into the prompts.

Art. 56 - Intrinsic Security of API Communication Channels
The Provider implements transport layer encryption (TLS), but excludes all liability for attacks perpetrated via the interception of local networks controlled by the User.

Art. 57 - Technical Retention of Contractual Tracking Logs
Logs certifying contractual acceptance of these 88 articles will be retained indefinitely for the Provider's legal protection, extending past service termination.

Art. 58 - Incompatibility with Physical Audits or Direct Inspections
The Provider excludes all physical or logical access by the User, their employees, auditors, or third-party inspectors to its private global cloud infrastructure.

Art. 59 - Data Breach Management and Notification Protocol
In the event of a security breach on the servers, the Provider will inform the User within the timelines mandated by applicable law, declaiming all liability for induced damages.

Art. 60 - Post-Termination Data Erasure and Irrecoverability
Following account closure, the Provider will purge all corporate data from active databases, relieving itself of any subsequent conservation or retrieval obligations.

SECTION VI: OPERATIONAL RESTRICTIONS, PROHIBITED USES, AND GEOPOLITICAL PROVISIONS
Art. 61 - Universal Scraping and Mass Extraction Prohibition
The deployment of bots, scrapers, automated scripts, or data extraction software designed to systematically download templates or the SaaS knowledge base is strictly prohibited.

Art. 62 - Specificity of Computing Thresholds (Token Cap)
Monthly processing volumes are strictly bounded by the commercial parameters of the active subscription tier. Reaching the cap triggers immediate generation halts.

Art. 63 - Computing Resource Fair Use Policy
The Provider reserves the right to temporarily throttle bandwidth or generation speeds for any account whose operational behavior saturates shared global servers.

Art. 64 - Absolute Military and Weaponry Use Prohibition
The use of this software to structure management procedures or ISO documentation destined for the production, development, trade, or stockpiling of weapons or warfare technologies globally is strictly prohibited.

Art. 65 - Critical Infrastructure and Safety-Critical Exclusion
The software must not be utilized for documentation linked to nuclear facilities, mass transit networks, vital medical operations, or any systems where failure poses life-threatening risks.

Art. 66 - Total Exclusion of Protective Effects Toward Interposed Third Parties
This agreement confers no legal rights or actionable claims to third parties, sub-suppliers, or end-clients of the User, who remain entirely detached from this legal relationship.

Art. 67 - Mandatory Cooperative Bug and Vulnerability Reporting
The User agrees to immediately and confidentially communicate any discovered system bugs or vulnerabilities to the Provider, refraining from any exploitation thereof.

Art. 68 - Prohibition of Fraudulent Interposition in Reselling
The User may not resell generated documents under the pretense that they are the exclusive output of manual, human-driven consulting activities.

Art. 69 - Self-Certification of Professional B2B Commercial Status
The Tenant guarantees that the subscription is executed exclusively for business purposes, formally waiving consumer protection frameworks applicable in various nations.

Art. 70 - Contractual Synallagma Based on Risk Disclaimer
The User explicitly recognizes that the commercial pricing of the subscription is directly calculated based on the total effectiveness of the waivers and the global €100 liability cap established in Art. 22.

SECTION VII: TERMINATION, INTERNATIONAL JURISDICTIONAL CLAUSES, AND CLOSURE
Art. 71 - Duration, Automatic Renewal, and Billing Cycles
The contract remains valid for the chosen duration (monthly or annually) and auto-renews unless a digital cancellation notice is submitted prior to the expiration date.

Art. 72 - Execution of Electronic Cancellation
The User may terminate the agreement at any moment by disabling the automatic renewal function within the platform's account management dashboard.

Art. 73 - Provider's Right to Terminate Ad Nutum
The Provider retains the right to terminate the contract at any time without cause by providing 30 days' notice, issuing a pro-rata refund for any unused subscription period.

Art. 74 - Express Termination Clause for Structural Breaches
The contract terminates automatically by law if the User violates clauses regarding reverse engineering, prompt injections, or mandatory human validation.

Art. 75 - Emergency Precautional Suspension for Illicit Use
The Provider is authorized to freeze Tenant workspace access immediately if technical logs demonstrate code attacks or violations of use restrictions.

Art. 76 - Effects of Termination and API Key Deactivation
Upon termination for any cause, all calculation keys and associated Tenant sub-accounts will be systematically deactivated, ending all document export functions.

Art. 77 - Exclusive Jurisdictional Prevalence of the Italian Language
In the event of discrepancies, automated translations, or divergent interpretations of this agreement in foreign markets, the original Italian version remains the sole legally and hermeneutically binding text.

Art. 78 - International Severability Clause
The invalidity, nullity, or unenforceability of any single article determined by a court of law shall not compromise the legal efficacy and enforcement of the remaining contractual articles.

Art. 79 - Formal Waiver of Injunctive Relief and Emergency Orders
The User irrevocably waives any right to seek emergency court injunctions, asset seizures, or judicial blocks aimed at halting the development, provision, or commercial operation of the SaaS platform worldwide.

Art. 80 - Global Class Action Waiver
The User commits to resolving any dispute against the Provider strictly on an individual basis, formally waiving participation in class actions or group lawsuits across all legal systems.

Art. 81 - Universal Governing Law Selection Clause
This contract, along with any non-contractual obligations arising from or connected to it, shall be exclusively governed by and construed in accordance with the laws of the State where the Provider has its principal registered headquarters at the time the dispute arises.

Art. 82 - Exclusive International Forum Selection Clause
Any international dispute arising from this contract shall be submitted to the exclusive, unique, and overriding jurisdiction of the Court of the locality where the Provider has established its principal registered headquarters, with the User expressly and definitively waiving any right to initiate proceedings within their own country of establishment, residence, domicile, or any other competing global forum.

Art. 83 - Evidentiary Value of Digital System Logs
Technical system logs, timestamps, and database checksums maintained on the Provider's servers constitute the sole objective and admissible evidence to reconstruct transactions and computing interactions.

Art. 84 - Absolute Prohibition of Payment Retention or Set-Offs
The User may not suspend, delay, or balance out subscription fee payments by alleging perceived defects or generation errors within the artificial intelligence engine.

Art. 85 - Retention of Rights and Non-Waiver
The failure of the Provider to exercise or enforce any right or penalizing clause under this agreement does not constitute a waiver of such rights regarding subsequent or future breaches.

Art. 86 - Entire Agreement and Merger Clause
These 88 articles constitute the complete and exclusive agreement between the parties. No marketing materials, verbal promises, or commercial communications carry contractual value.

Art. 87 - Contractual Perimeter Stabilization Clause
In the event of platform updates, the binding version of the contract is that which is digitally accepted and timestamped in the log at the exact moment of document calculation.

Art. 88 - Execution via Definitive Electronic Contractual Seal
Selecting the checkbox during login or account creation constitutes formal signature of this contract. The User declares they have reviewed, understood, and specifically approved each of the 88 articles, accepting without reservation all liability limits, the mandatory human validation filter, and the exclusive governing law and forum selection dictated by the Provider's registered headquarters for any action brought from any location on the planet.

Art. 89 - AI Hallucinations and Mandatory Human Validation
The User expressly acknowledges that the Artificial Intelligence language models (Google Gemini) integrated into the platform for text processing may produce inaccuracies, outdated regulatory citations, typos, or errors resulting from the technical phenomenon known as "hallucination." The Provider releases no warranty, express or implied, regarding the legal compliance, accuracy, or completeness of the outputs generated. The Application does not provide, and is not intended to replace, binding legal, technical, compliance, or certification advice. It is the User's strict and mandatory obligation to submit every single document, clause, or procedure to the verification, approval, and manual signature of a qualified auditor, consultant, or company manager before any operational, corporate, or contractual adoption. Use of the software does not guarantee passing official certification audits or exemption from regulatory sanctions.`
  },
  {
    id: 'privacy',
    title: '# 4 PRIVACY POLICY',
    badge: 'Protezione Dati & Zero Retention',
    shortDesc: 'Politica di non conservazione, ruoli privacy e gestione dei dati.',
    content: `PREAMBLE AND COORDINATION WITH CONTRACTUAL TERMS
This Privacy Policy integrates and forms an inseparable part of the legal ecosystem comprising the Non-Disclosure Agreement (NDA), the End-User License Agreement (EULA), and the Disclaimer (General Terms and Conditions). Defined terms capitalized herein (e.g., "Provider", "User", "Tenant", "Dashboard", "Confidential Information") shall retain the exact same meaning ascribed to them in the aforementioned contractual agreements.

QUICK HIGHLIGHTS: HOW WE HANDLE YOUR DATA IN THIS APP
- Zero Storage: The data you type into the chat does not remain on our servers and is never archived in our databases.
- No Logs: We do not keep the history of your messages or any logs of the conversations.
- Instant Document Management: Documents you compile or modify are generated instantly. You can download or print them directly to your device. Once the session is closed, no copy remains in the application.
- Secure Processing: To answer your requests, we use Google's enterprise paid APIs. They process the text solely to provide real-time responses and are strictly prohibited from reusing your data for AI training models.

1. DATA CONTROLLER AND PRIVACY ROLES (Art. 53 Disclaimer)
Provider as Data Processor: Pursuant to Art. 53 of the Disclaimer, regarding any data, text, and information inputted directly by the User into the platform prompts or the real-time application chat for generating automated text drafts and filling document templates, the Provider acts strictly as a Data Processor. The Tenant assumes the exclusive classification and legal obligations of a Data Controller.
Third-Party Sub-Processors (AI Services): For natural language processing and generating real-time algorithmic responses within the chat, the Provider utilizes commercial, paid API services from Google (Google AI Studio Enterprise / Paid Tier). Google LLC / Google Ireland Ltd. acts as a Sub-Processor. Pursuant to the enterprise contractual terms governing this paid tier, data is transmitted via secure encrypted channels (HTTPS/TLS) and is neither retained by Google nor utilized to train their proprietary artificial intelligence models.
Provider as Data Controller: The Provider operates as a Data Controller solely regarding registration data, billing details, technical access logs, and contractual tracking files belonging to Tenants and their sub-users.

2. CATEGORIES OF DATA COLLECTED AND STRUCTURAL SENSITIVE DATA EXCLUSION
The Provider collects the following categories of data:
Tenant Identification and International Registration Data: Corporate name, international tax codes, corporate registration numbers (e.g., VAT, EIN, LEI, Business ID), primary registered office address, and geographic location of establishment.
Sub-User Data and Evidentiary Logs: Corporate email addresses, access credentials/API keys, IP addresses, user-agent strings, and timestamps relating to every independent opt-in, login, or computational interaction.
Tracking and Ownership Data (Blockchain Log): Technical data associated with material downloads and code usage, registered via Blockchain Timestamping technology to verify the downloader's identity and document integrity.
Absolute Prohibition on Sensitive or Protected Data (Art. 55 Disclaimer): In full compliance with Art. 55 of the Disclaimer, the User is strictly prohibited from entering health, biometric, judicial, political, or personal data subject to special national protection frameworks into the chat or prompts. The Provider does not perform pre-screening operations and declaims all liability for breaches resulting from the insertion of such prohibited data.

3. PURPOSES OF PROCESSING AND LEGAL BASES
The processing of personal data is governed by the principles of lawfulness and necessity, according to the following purposes:
Contract Execution and SaaS Delivery: To allow access to the Dashboard, manage the multi-tenant workspace architecture, and deliver real-time chat functionalities and algorithmic calculation based on statistical AI models.
Forensic Tracking and Intellectual Property Protection: To monitor download patterns and access logs in order to prevent abuse (such as mass scraping, reverse engineering, prompt injection attacks, or unauthorized account sharing) and to enable Blockchain marking (Art. 3 NDA, Art. 4 and 6 EULA).
Legal Protection and Indefinite Retention of Contractual Logs: Pursuant to Art. 57 of the Disclaimer, logs certifying the electronic acceptance of the 88 contractual articles and their associated indemnity clauses will be retained indefinitely for the Provider's legal protection, extending past service termination.

4. CLOUD ARCHITECTURE AND CROSS-BORDER DATA FLOWS (Art. 51-52 Disclaimer)
Multinational Transfers: The software architecture operates utilizing international servers, third-party enterprise AI infrastructure (Google API), and data centers distributed across multiple continents and regions based on logistical requirements.
Authorization for Transfer: As established by Art. 52 of the Disclaimer, the User grants definitive, unconditional consent for operational data, technical logs, and chat prompts to be transferred and processed outside their country of origin or use. Both parties pledge to respect, within their respective operational boundaries, all applicable global and supranational corporate data protection regulations.

5. DATA SECURITY AND LIMITATION ON PHYSICAL INSPECTIONS (Art. 49, 56, 58 Disclaimer)
Standard Security Measures: The Provider implements transport layer encryption (TLS/HTTPS) for all API and chat communication channels. Operational data and configurations of each customer are logically segregated at the database level through a multi-tenant structure.
User Negligence Liability Exclusion: The Provider is not liable for data breaches resulting from User negligence in managing their unique tokens, passwords, or access credentials (Art. 49 & 56 Disclaimer).
Incompatibility with Physical Inspections: Pursuant to Art. 58 of the Disclaimer, the Provider excludes all physical or logical access by the User, their employees, auditors, or third-party inspectors to its private global cloud infrastructure.

6. DATA RETENTION, ZERO-RETENTION CHAT PROTOCOL, AND POST-TERMINATION ERASURE (Art. 5 NDA, Art. 60 Disclaimer)
Immediate Zero-Retention Chat Protocol: As an exception to standard database storage, the application does not store, archive, or save chat messages, user-typed prompt data, or custom-generated documents within its local databases or servers. No identifying logs of the conversations are kept. Upon closing the active session, all inputted and transiently processed data is permanently erased from the system.
Instantaneous Document Management: Files or documents modified or generated via the chat derive from predefined templates and are processed instantly. The User must download or print the document directly to their local device. No customized or generated files are retained on the Provider's servers.
Corporate and Subscription Data: Following account closure or termination due to insolvency, the Provider will purge all corporate registration and billing data from active databases, relieving itself of any subsequent conservation or retrieval obligations (Art. 50 & 60 Disclaimer).
Data Covered by NDA: Information exchanged within the perimeter of the Non-Disclosure Agreement remains subject to confidentiality obligations for a period of 3 (three) years following the termination of the relationship.
Exception for Legal Logs: The indefinite retention of contractual acceptance logs for judicial protection purposes remains unaffected (Art. 57 Disclaimer).

7. DATA BREACH MANAGEMENT AND NOTIFICATION PROTOCOL (Art. 59 Disclaimer)
In the event of a security breach on the servers, the Provider will inform the User within the timelines mandated by applicable law, declaiming all liability for induced, indirect, or reputational damages, as well as administrative sanctions imposed on the User (Art. 17-21, Art. 59 Disclaimer).

8. GOVERNING LAW, EXCLUSIVE JURISDICTION, AND PREVALENT LANGUAGE
Governing Law and Forum: Any data processing connected to the use of the platform and any dispute arising out of or connected to it shall be exclusively governed by and construed in accordance with the laws of the State where the Provider has its principal registered headquarters, and submitted to the unique and overriding jurisdiction of the Court of such locality, with the User expressly waiving any right to compete in other global forums (Art. 81-82 Disclaimer).
Prevalence of Language: In the event of discrepancies, automated translations, or divergent interpretations of this agreement in foreign markets, the original Italian version remains the sole legally and hermeneutically binding text (Art. 77 Disclaimer).`
  }
];
