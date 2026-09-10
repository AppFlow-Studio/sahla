/**
 * The Terms of Use and Privacy Policy, as shown inside the app.
 *
 * Generated from the source `.docx` masters. The template's front-matter
 * checklist page ("REMOVE THIS PAGE BEFORE PUBLICATION") is deliberately not
 * included — only the operative sections are.
 *
 * Bracketed template fields became `{{TOKEN}}` placeholders, resolved at
 * render time from `src/legal/fields.ts`. Anything still unresolved is caught
 * by the dev-only check in `resolveLegalText`, so a bracket can't reach a user.
 *
 * To revise: edit the master, re-run the conversion, and re-check the token
 * list. Do not hand-edit prose here without the same change landing in the
 * master, or the two will drift.
 */

export type LegalSection = {
  /** Section number as printed in the master. */
  n: number;
  title: string;
  body: string[];
};

export type LegalDocId = 'terms' | 'privacy';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    n: 1,
    title: 'Acceptance of These Terms',
    body: [
      'These Terms of Use (these “Terms”) are a binding agreement between you and {{SAHLA_ENTITY}}, a {{SAHLA_STATE}} corporation (“Sahla,” “we,” “us,” or “our”), governing your use of the {{MASJID_NAME}} mobile application (the “App”). The App is provided to the community of {{MASJID_NAME}} (the “Masjid”) and is built and maintained by Sahla, which operates the technology platform behind the App. By creating an account, checking the acceptance box presented at registration, or using the App, you accept these Terms and our Privacy Policy, which is incorporated into these Terms by reference. If you do not agree to these Terms, do not use the App.',
      'Age and parental acceptance. You must be at least 13 years of age to create an account. If you are between 13 and 17 years of age, a parent or legal guardian must review and accept these Terms on your behalf, and by permitting your use of the App they accept these Terms — including the arbitration agreement and class waiver in Section 15 — for both themselves and you. Your use of the App is also subject to the consent described in Section 10 of the Privacy Policy. Sahla may request confirmation of parental acceptance and may suspend an account where it is not provided.',
      'IMPORTANT: SECTION 15 OF THESE TERMS CONTAINS AN ARBITRATION AGREEMENT AND A WAIVER OF CLASS ACTIONS AND JURY TRIALS. IT AFFECTS HOW DISPUTES BETWEEN YOU AND SAHLA ARE RESOLVED. PLEASE READ IT CAREFULLY. YOU MAY OPT OUT OF ARBITRATION AS DESCRIBED IN SECTION 15.',
    ],
  },
  {
    n: 2,
    title: 'The Two Organizations',
    body: [
      'The App carries the Masjid’s name and serves the Masjid’s community. The App is distributed under the Masjid’s own Apple Developer and Google Play developer accounts; Sahla acts as a technical team member on those accounts on the Masjid’s behalf.',
      'The Masjid is responsible for the content, announcements, programs, events, and advertisements it publishes in the App, for the programs and services it provides to its community, and for its solicitation and use of donations.',
      'Sahla is a technology provider: it operates the software, accounts, notifications, and payment infrastructure on the Masjid’s behalf. Sahla is not a religious organization, a charity, or a fiduciary of the Masjid or of you, and it does not supervise, endorse, or assume responsibility for the Masjid’s programs, content, or religious guidance. Sahla provides technology only; it does not solicit contributions, does not control or direct any fundraising, does not hold or handle donated funds, and is compensated solely by a fixed monthly subscription fee paid by the Masjid that does not vary with donation volume. Accordingly, Sahla is not a “fundraising counsel,” “professional solicitor,” or “professional fundraiser” for the Masjid within the meaning of New York Executive Law Article 7-A or comparable charitable-solicitation laws of other states. The Masjid is solely responsible for its own compliance with charitable-solicitation registration and reporting requirements in every state in which it solicits.',
    ],
  },
  {
    n: 3,
    title: 'Accounts',
    body: [
      'You agree to provide accurate, current, and complete information when creating an account and to keep it updated. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us promptly at {{SUPPORT_EMAIL}} of any unauthorized use. You may maintain only one account, and you may not transfer your account to another person. You may delete your account at any time in the App (Settings → Account → Delete Account) or at {{DELETE_ACCOUNT_URL}}.',
    ],
  },
  {
    n: 4,
    title: 'Donations',
    body: [
      'Donations are between you and the Masjid. When you donate through the App, your donation is processed by Stripe, Inc. and settles directly to the Masjid’s own connected account. Sahla is not a party to your donation, does not hold donated funds, does not take any percentage of any donation, and does not receive any compensation that varies with the amount you give. All donations are voluntary.',
      'The Masjid’s responsibilities. The Masjid is solely responsible for the use of donations, for issuing any tax acknowledgment or receipt, for the accuracy of any statement it makes about the deductibility of a gift, and for its own tax-exempt status. Sahla makes no representation that any donation is tax-deductible.',
      'Recurring donations. If you set up a recurring donation, it will continue at the interval you select until you cancel it. You may cancel at any time in the App, effective as to any donation not yet processed. You will receive a receipt for each donation.',
      'Disputes and refunds. Questions or concerns about a donation — including any request for a refund — are between you and the Masjid and are subject to the Masjid’s own policies. Sahla will reasonably assist in directing your inquiry to the Masjid but does not decide donation disputes and cannot reverse a settled donation.',
    ],
  },
  {
    n: 5,
    title: 'Programs, Events, and Registrations',
    body: [
      'The App allows you to register for the Masjid’s programs, classes, and events, and to pay any associated fees, which are set by, paid to, and refundable only by the Masjid. The Masjid is solely responsible for its programs — including their content, scheduling, staffing, supervision, safety, changes, cancellations, and any refund of program fees.',
      'Program fees are for services delivered in person. Program and event fees paid through the App are consideration for services the Masjid provides in the physical world — classes, lectures, gatherings, and events held at or organized by the Masjid — and are not payment for digital content, features, or functionality delivered within the App.',
      'Registering another person. If you register a child or family member for a program, you represent that you are their parent or legal guardian or are otherwise authorized to do so, and you accept these Terms on their behalf. Information you provide about a registrant is handled as described in Section 10 of the Privacy Policy. The App does not collect health, allergy, medical, or disability information; if a program requires it, the Masjid will collect it outside the App.',
    ],
  },
  {
    n: 6,
    title: 'Payments and App Store Rules',
    body: [
      'Donations and program fees are processed through Stripe rather than through Apple’s in-app purchase system, because they are charitable contributions to the Masjid and payment for real-world services respectively, each of which the applicable store rules permit to be processed outside in-app purchase. The App does not sell digital content, subscriptions, or in-app features to you. Neither the Masjid nor Sahla will enable the sale of digital-only content through the App except through the store’s required in-app purchase mechanism.',
    ],
  },
  {
    n: 7,
    title: 'Prayer Times and Religious Content',
    body: [
      'Prayer times, Hijri dates, qibla direction, calendars, and similar features in the App are provided for informational convenience and are generated by calculation. Calculation methods and community conventions vary, and the times and rulings announced by the Masjid govern its congregational activities. Religious content in the App is published by the Masjid and reflects the Masjid’s own views; questions about it should be directed to the Masjid. Sahla does not author, review, endorse, or take any position on religious content.',
    ],
  },
  {
    n: 8,
    title: 'Advertisements',
    body: [
      'The Masjid may display advertisements from local businesses in the App. Advertisements are selected, priced, and supplied by the Masjid. Neither the Masjid’s display of an advertisement nor its presence in the App is an endorsement by Sahla, and Sahla does not review advertisements for accuracy or legality. Your dealings with any advertiser are solely between you and that business. As described in the Privacy Policy, advertisements are not targeted using your Personal Information and the App contains no third-party advertising technology.',
    ],
  },
  {
    n: 9,
    title: 'License and Intellectual Property',
    body: [
      'Subject to these Terms, Sahla grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to install and use the App for your personal, non-commercial use. The App’s software, design, and underlying technology are owned by Sahla and its licensors; the Masjid’s name, logo, and content are owned by the Masjid. Your use of the App does not transfer to you any ownership of, or rights in, the App, the platform, or any intellectual property of Sahla or the Masjid, and no rights are granted by implication. If you provide feedback or suggestions, you grant Sahla a perpetual, irrevocable, royalty-free right to use them without restriction or compensation.',
    ],
  },
  {
    n: 10,
    title: 'Your Content',
    body: [
      'What you own. You retain ownership of the content you submit through the App, including messages, registration details, photographs, and feedback (“Your Content”).',
      'The license you grant. You grant Sahla and the Masjid a non-exclusive, royalty-free, worldwide license to host, store, reproduce, transmit, and display Your Content solely as necessary to operate the App and deliver the features you use. This license is limited to operating the App; it ends when you delete Your Content or your account, except for copies retained in backups as described in the Privacy Policy or where retention is required by law. Your Content is not published beyond the App, is not used for advertising, and is not used to train artificial-intelligence models.',
      'Your representations. You represent that Your Content is lawful, is yours to submit, and does not infringe or violate the rights of any person.',
      'Removal. Sahla and the Masjid may remove or decline to display any content that violates these Terms or applicable law, but neither has any obligation to monitor content.',
    ],
  },
  {
    n: 11,
    title: 'Acceptable Use',
    body: [
      'You agree that you will not, and will not attempt to:',
      'use the App for any unlawful purpose or in violation of these Terms;',
      'scrape, crawl, harvest, or otherwise extract data from the App, or access the App by any automated means;',
      'copy, modify, distribute, sell, or lease any part of the App, or reverse engineer, decompile, or disassemble the App, except to the extent a restriction is prohibited by applicable law;',
      'interfere with or disrupt the App, probe or circumvent its security features, or access accounts or data belonging to others;',
      'impersonate any person or entity, or submit false or fraudulent registrations or payments;',
      'harass, abuse, threaten, or harm another person, or post or transmit content that is unlawful, defamatory, hateful, obscene, or infringing;',
      'use the App to send unsolicited commercial messages to other members of the community; or',
      'use the App to develop a competing product or service, or resell access to the App.',
      'Violation of this Section may result in suspension or termination of your account. Sahla may investigate suspected violations and cooperate with law enforcement.',
    ],
  },
  {
    n: 12,
    title: 'Copyright Complaints (DMCA)',
    body: [
      'Sahla respects intellectual property rights and responds to notices of alleged infringement in accordance with the Digital Millennium Copyright Act, 17 U.S.C. § 512.',
      'Notice. If you believe content available through the App infringes your copyright, send a written notice to Sahla’s designated agent containing the elements required by 17 U.S.C. § 512(c)(3): (a) a physical or electronic signature of a person authorized to act on behalf of the owner of the exclusive right allegedly infringed; (b) identification of the copyrighted work claimed to have been infringed; (c) identification of the material claimed to be infringing and information reasonably sufficient to permit us to locate it; (d) your contact information; (e) a statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law; and (f) a statement, made under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on the owner’s behalf.',
      'Designated agent. Copyright Agent, {{SAHLA_ENTITY}}; {{DMCA_EMAIL}}. Sahla’s designated agent is registered with the U.S. Copyright Office.',
      'Counter-notice. If your content was removed and you believe the removal was in error or misidentification, you may send a counter-notice containing the elements required by 17 U.S.C. § 512(g)(3), including your consent to the jurisdiction of the federal district court for the district in which you reside (or, if outside the United States, the Southern District of New York) and to accept service from the complaining party. We may restore the material within ten to fourteen business days unless the complaining party notifies us that it has filed an action seeking a court order.',
      'Repeat infringers. It is Sahla’s policy, in appropriate circumstances, to disable and terminate the accounts of users who are repeat infringers, and to terminate the App and platform access of any masjid that repeatedly publishes infringing content. Misrepresentations in a notice or counter-notice may result in liability for damages under 17 U.S.C. § 512(f).',
    ],
  },
  {
    n: 13,
    title: 'Communications',
    body: [
      'By providing your mobile phone number or enabling notifications, you consent to receive communications from the App related to your account, registrations, donations, and the Masjid’s announcements, including push notifications and, where applicable, text messages (message frequency varies; message and data rates may apply; reply STOP to opt out of texts and HELP for help). Marketing text messages, if any, are sent only with your separate express written consent, and opting out of them does not stop transactional messages necessary to the service. You consent to receive agreements, notices, disclosures, and other communications electronically, and you agree that electronic communications satisfy any legal requirement that a communication be in writing. You may withdraw this consent by closing your account.',
    ],
  },
  {
    n: 14,
    title: 'Disclaimers; Limitation of Liability; Indemnification',
    body: [
      'TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW: THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. SAHLA DOES NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT PRAYER TIMES, CALENDARS, OR SIMILAR CALCULATED INFORMATION WILL BE ACCURATE. THE MASJID’S PROGRAMS, EVENTS, CONTENT, ADVERTISERS, AND USE OF DONATIONS ARE THE SOLE RESPONSIBILITY OF THE MASJID, AND SAHLA MAKES NO WARRANTY OR REPRESENTATION REGARDING THEM. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES, SO SOME OF THE ABOVE EXCLUSIONS MAY NOT APPLY TO YOU.',
      'TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW: (A) SAHLA WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST DATA OR LOSS OF GOODWILL, ARISING OUT OF OR RELATING TO THESE TERMS OR THE APP, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES; (B) SAHLA WILL NOT BE LIABLE FOR THE ACTS OR OMISSIONS OF THE MASJID, INCLUDING ITS PROGRAMS, EVENTS, CONTENT, ADVERTISERS, PERSONNEL, OR USE OF DONATIONS; AND (C) SAHLA’S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE APP WILL NOT EXCEED THE GREATER OF THE AMOUNTS YOU HAVE PAID TO SAHLA IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM OR ONE HUNDRED U.S. DOLLARS (US$100).',
      'NOTHING IN THESE TERMS LIMITS OR EXCLUDES LIABILITY FOR SAHLA’S OWN GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR FRAUD, OR FOR PERSONAL INJURY OR DEATH CAUSED BY SAHLA’S NEGLIGENCE, OR ANY OTHER LIABILITY THAT CANNOT BE LIMITED OR EXCLUDED UNDER APPLICABLE LAW. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU. THE LIMITATIONS IN THIS SECTION ARE A FUNDAMENTAL BASIS OF THE BARGAIN BETWEEN YOU AND SAHLA.',
      'Indemnification. You agree to indemnify, defend, and hold harmless Sahla and its officers, directors, employees, and agents from and against claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising out of or relating to your breach of these Terms, your misuse of the App, Your Content, or your violation of law or the rights of any third party — except to the extent caused by Sahla’s own gross negligence, willful misconduct, or fraud. This Section does not apply to a user who was a minor at the time of acceptance except to the extent the parent or legal guardian who accepted these Terms is bound.',
    ],
  },
  {
    n: 15,
    title: 'Dispute Resolution; Arbitration; Class Waiver',
    body: [
      'Talk to us first. Before filing a claim, you and Sahla each agree to try to resolve the dispute informally: send a written description of the dispute to {{LEGAL_EMAIL}} (or, from Sahla, to your account email), and the parties will negotiate in good faith for sixty (60) days. Most concerns are resolved this way. The statute of limitations and any filing-fee deadlines are tolled during this period.',
      'Agreement to arbitrate. Except as provided below, any dispute, claim, or controversy arising out of or relating to these Terms or the App will be resolved by final and binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, as modified by these Terms. The Federal Arbitration Act governs this Section. The arbitration will be conducted by a single arbitrator, in the county where you reside or remotely by videoconference at your election, with fees allocated as provided in the AAA Consumer Arbitration Rules. The arbitrator has exclusive authority to resolve all disputes, including the scope and enforceability of this Section, except that a court will decide the enforceability of the Class Waiver below.',
      'Carve-outs. Either party may bring an individual claim in small claims court, and either party may seek injunctive or other equitable relief in a court of competent jurisdiction for actual or threatened infringement or misuse of intellectual property or for unauthorized access to or extraction of data from the App.',
      'CLASS WAIVER: YOU AND SAHLA EACH WAIVE THE RIGHT TO A TRIAL BY JURY AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING. CLAIMS MAY BE BROUGHT ONLY IN AN INDIVIDUAL CAPACITY. IF THIS CLASS WAIVER IS FOUND UNENFORCEABLE AS TO A PARTICULAR CLAIM, THAT CLAIM (AND ONLY THAT CLAIM) WILL PROCEED IN COURT, AND THE REMAINDER OF THIS SECTION CONTINUES TO APPLY TO ALL OTHER CLAIMS.',
      'Users under 18. If you are under 18, a parent or legal guardian must accept these Terms on your behalf as described in Section 1, and by permitting your use of the App they agree to this Section 15 for both themselves and you. If a court determines that this Section is not enforceable against a user who was a minor at the time of acceptance, that determination applies only to that user and does not affect the enforceability of this Section as to any other user; the remainder of these Terms continues in full force.',
      'Coordinated and mass filings. If twenty-five (25) or more substantially similar arbitration demands are filed against Sahla by or with the coordination of the same or coordinated counsel, the parties agree the demands will be administered in staged batches of up to fifty (50) under the applicable AAA procedures, with a single arbitrator per batch. The parties will select an equal number of bellwether cases from each batch to be heard first, and will attempt in good faith to resolve the remaining demands in the batch by applying the outcomes of the bellwether proceedings. Filing-fee and limitations deadlines are tolled for demands awaiting their batch. This provision is severable from, and survives any finding of unenforceability as to, any other part of this Section.',
      'Your right to opt out. You may opt out of this arbitration agreement and Class Waiver by emailing {{LEGAL_EMAIL}} with the subject line “Arbitration Opt-Out,” including your name and account email, within thirty (30) days of first accepting these Terms. Opting out does not affect any other provision of these Terms and will not affect your use of the App.',
    ],
  },
  {
    n: 16,
    title: 'Governing Law and Venue',
    body: [
      'These Terms are governed by the laws of the State of New York, without regard to conflict-of-laws principles, except that the Federal Arbitration Act governs Section 15, and except that nothing in this Section deprives you of the protection of any mandatory consumer-protection law of the state in which you reside. For any matter not subject to arbitration, you and Sahla consent to the exclusive jurisdiction and venue of the state and federal courts located in Richmond County, New York.',
    ],
  },
  {
    n: 17,
    title: 'App Store Terms',
    body: [
      'General. If you download the App from the Apple App Store or Google Play, the store is not a party to these Terms, and your use of the App must also comply with the store’s applicable terms of service.',
      'Apple-specific terms. The following applies if you use the iOS App: these Terms are concluded between you and Sahla only, not with Apple Inc. (“Apple”), and Sahla, not Apple, is solely responsible for the App and its content. Your license to the iOS App is limited to a non-transferable license to use it on Apple-branded products that you own or control, as permitted by the Usage Rules in the Apple Media Services Terms and Conditions (except that the App may be accessed by other accounts via Family Sharing or volume purchasing). Sahla, not Apple, is solely responsible for providing any maintenance and support services for the App; Apple has no obligation whatsoever to furnish any maintenance or support services with respect to the App. To the maximum extent permitted by law, Apple has no warranty obligation with respect to the App; in the event of any failure of the App to conform to an applicable warranty, you may notify Apple, and Apple will refund any purchase price paid for the App, and Apple will have no other warranty obligation. Apple is not responsible for addressing any claim by you or a third party relating to the App or your possession or use of it, including product liability claims, claims that the App fails to conform to legal or regulatory requirements, and claims arising under consumer protection, privacy, or similar legislation, including in connection with the App’s use of the HealthKit and HomeKit frameworks if applicable. In the event of a third-party claim that the App or your possession and use of it infringes intellectual property rights, Sahla, not Apple, is solely responsible for the investigation, defense, settlement, and discharge of the claim. You must comply with applicable third-party terms of agreement when using the App. Apple and Apple’s subsidiaries are third-party beneficiaries of these Terms, and upon your acceptance, Apple has the right (and is deemed to have accepted the right) to enforce these Terms against you as a third-party beneficiary. Sahla’s contact information for any question, complaint, or claim regarding the App is set out in Section 20.',
      'Export compliance. You represent and warrant that you are not located in a country subject to a U.S. Government embargo or designated by the U.S. Government as a “terrorist supporting” country, and that you are not listed on any U.S. Government list of prohibited or restricted parties.',
      'Google-specific terms. The following applies if you use the Android App: these Terms are concluded between you and Sahla only, not with Google LLC, and Google has no responsibility for the App or these Terms.',
    ],
  },
  {
    n: 18,
    title: 'Termination',
    body: [
      'You may stop using the App at any time and may delete your account in the App or at {{DELETE_ACCOUNT_URL}}. Sahla may suspend or terminate your access to the App, with notice where practicable, if you breach these Terms, if we reasonably suspect fraud or misuse, or where required for legal, security, or risk reasons.',
      'If the Masjid’s subscription ends. The App is provided under a subscription between Sahla and the Masjid. If that subscription ends, the App may be discontinued. In that event, Sahla will provide at least thirty (30) days’ notice through the App and by email where practicable, and will make your donation and registration history available for export before access ends. The Masjid retains its own records of your donations independently of the App.',
      'Survival. Upon termination, Sections 4 (as to completed donations), 9, 10, 11, 12, and 14 through 20 survive, along with any other provision that by its nature should survive.',
    ],
  },
  {
    n: 19,
    title: 'Changes to These Terms',
    body: [
      'Sahla may amend these Terms from time to time. If we make material changes, we will provide notice through the App and by email at least ten (10) days before the changes take effect, and we will update the Effective Date and Version above. Prior versions remain available at {{ARCHIVE_URL}}. Your continued use of the App after the Effective Date of amended Terms constitutes acceptance of the amendment. If we materially amend Section 15, you may reject the amendment by opting out as described in Section 15 within thirty (30) days of the amendment’s Effective Date, in which case the prior version of Section 15 continues to apply to you. No amendment applies retroactively to a dispute of which we had notice before the amendment’s Effective Date.',
    ],
  },
  {
    n: 20,
    title: 'General',
    body: [
      'These Terms, together with the Privacy Policy, are the entire agreement between you and Sahla regarding the App and supersede prior agreements on that subject. In the event of a conflict, these Terms govern as to your rights and obligations in using the App, and the Privacy Policy governs as to the collection, use, and disclosure of information. Your relationship with the Masjid — including its program terms, membership rules, and donation policies — is separate from these Terms and is not superseded by them.',
      'If any provision is held unenforceable, it will be enforced to the maximum extent permissible and the remaining provisions will remain in effect. Sahla’s failure to enforce a provision is not a waiver. You may not assign these Terms without Sahla’s prior written consent; Sahla may assign them in connection with a merger, acquisition, financing, or sale of assets. Nothing in these Terms creates any agency, partnership, joint venture, or employment relationship between you and Sahla, or between Sahla and the Masjid beyond that of technology provider and customer. Sahla is not liable for delay or failure to perform due to causes beyond its reasonable control. To the extent permitted by applicable law, any claim arising out of or relating to these Terms or the App must be filed within one (1) year after the claim accrues, or it is permanently barred. Notices to Sahla must be sent to the address in Section 21; notices to you may be provided through the App, by email, or by text message.',
    ],
  },
  {
    n: 21,
    title: 'Contact',
    body: [
      'Sahla — technology, accounts, and legal notices:',
      '{{SAHLA_ENTITY}} · Attn: Legal · {{LEGAL_EMAIL}} · Support: {{SUPPORT_EMAIL}} · Copyright: {{DMCA_EMAIL}}',
      'The Masjid — programs, donations, and content:',
      '{{MASJID_NAME}} · {{SUPPORT_EMAIL}}',
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    n: 1,
    title: 'Our Roles Under Privacy Law',
    body: [
      'Privacy laws distinguish between the organization that decides why information is used (the “controller,” or “business” under California law) and the organization that handles information on that organization’s instructions (the “processor,” or “service provider”). Sahla occupies both roles in this App, for different and separately identified purposes. We describe both so that you know who is responsible for what.',
      'The Masjid is the controller, and Sahla is its processor, for community information. Account information, profile information, program and event registrations, donation records, and communications you direct to the Masjid are handled by Sahla only on the Masjid’s documented instructions and only to provide, secure, and support the App. Sahla and the Masjid have entered into a written data processing agreement containing the terms required by applicable state privacy law, including restrictions on Sahla’s retention, use, and disclosure of that information, obligations of confidentiality, and a requirement that Sahla assist the Masjid in responding to your rights requests. Sahla does not sell that information, does not share it for cross-context behavioral advertising, does not retain or use it outside the direct business relationship with the Masjid, and does not combine it with information from other sources except as permitted by applicable law.',
      'Sahla is an independent controller for three limited purposes. Sahla determines the purposes and means of processing only for the following, each of which is described in detail in this Policy:',
      'Platform security and fraud prevention — detecting, investigating, and preventing fraud, abuse, security incidents, and misuse across the platform (Section 3);',
      'Service diagnostics and quality — maintaining, diagnosing, debugging, and improving the operation, security, and reliability of the App and the platform, using device, log, and aggregate usage information. Sahla does not use community information to build or enrich a profile of you outside your relationship with the Masjid, and does not use it to develop unrelated products (Section 3); and',
      'Publication of Masjid Content selected by the Masjid — the publication of content the Masjid affirmatively chooses to distribute beyond the App, as described in Section 5. This concerns content published by the Masjid, not your Personal Information.',
      'Retention periods described in Section 8 are set by Sahla as a platform-wide baseline; the Masjid may instruct shorter retention for its own community’s information, and the Masjid retains its own donation and program records independently of the App.',
      'Where this Policy describes how information is used or how you exercise your rights in the Masjid’s role as controller, Sahla acts on the Masjid’s behalf and assists the Masjid in meeting its obligations; the Masjid remains responsible for its own privacy practices.',
    ],
  },
  {
    n: 2,
    title: 'Information We Collect',
    body: [
      'Information you provide. We collect the following categories of information that you provide directly:',
      'Account information: your name, email address, mobile phone number, and password when you create an account.',
      'Profile information: details you choose to add to your profile, such as your preferred language or notification preferences.',
      'Program and event registrations: the programs, classes, and events you register for, and the registration details the program requires. If you register a child or another family member for a program, you provide their name and any information the program requires, as described in Section 10.',
      'Donation information: the amount, date, and designation of donations you choose to make, so that the Masjid can acknowledge your generosity and provide records for your tax purposes.',
      'Communications: messages you send through the App, correspondence with support, and any feedback you submit.',
      'We do not collect health information. Program and event registration in the App does not request, and the App does not provide any field for, information about your or a family member’s health, medical conditions, allergies, medications, disabilities, or treatment. If a Masjid program requires such information, it is collected by the Masjid outside the App and is not governed by this Policy. Accordingly, the App does not collect “consumer health data” within the meaning of the Washington My Health My Data Act, the Nevada consumer health data law, or comparable laws.',
      'Payment information. Payments and donations in the App are processed by Stripe, Inc., a third-party payment processor. Your full card number is transmitted directly to Stripe and is not stored on Sahla’s systems. Donations and program fees settle directly to the Masjid’s own connected account. We receive limited payment details from Stripe, such as the transaction amount, card brand, the last four digits of your card, and payment status, in order to display your history and receipts.',
      'Information collected automatically. When you use the App, we collect device and usage information, including your device type and identifiers, operating system and app version, IP address, general log data, in-app activity (such as screens viewed and features used), and crash and performance diagnostics. Advertising features, advertising identifiers, and cross-application tracking are disabled in our analytics configuration. We do not track you across apps or websites owned by other companies, and we do not request permission to do so.',
      'Location information (optional). If the App offers location-based features such as prayer times or qibla direction, and you grant the applicable device permission, we use your device’s approximate location to provide those features while you are using the App. You may instead select your city manually. We do not collect location information in the background, and location is never used for advertising.',
      'Push notifications. With your permission, the App sends push notifications for announcements, prayer reminders, program updates, and other communications from the Masjid. You can manage or disable notifications at any time in your device settings.',
      'Cookies. The App itself does not use cookies. Any Sahla or Masjid website you visit may use cookies necessary for sign-in, security, preferences, and analytics; we do not use cookies for cross-context behavioral advertising.',
    ],
  },
  {
    n: 3,
    title: 'How We Use Information',
    body: [
      'We use the information described in Section 2 for the following purposes:',
      'Operate the App: create and maintain your account, deliver the Masjid’s content and announcements, manage program and event registrations, process donations and payments through Stripe, and provide receipts and records;',
      'Serve the community: enable the Masjid’s authorized administrators to understand and serve their community — for example, viewing program registrations, attendance, and engagement so the Masjid can plan programs and communicate effectively;',
      'Provide support: respond to your questions and help resolve issues;',
      'Keep the App safe: detect, investigate, and prevent fraud, abuse, security incidents, and misuse;',
      'Maintain and improve the platform: diagnose problems, debug errors, understand feature usage in the aggregate, and develop improvements to the App and the platform; and',
      'Comply with law: satisfy tax, accounting, legal, and regulatory obligations.',
      'We do not use your information for artificial-intelligence training. We do not use your Personal Information, your communications, your donation or registration records, or content that identifies you to train, fine-tune, or evaluate artificial-intelligence or machine-learning models, and we do not permit our service providers to do so. If we ever propose to change this, we will provide advance notice and obtain any consent required by law before doing so.',
      'Sensitive information. Because the App serves a religious community, information such as program attendance or donations could reveal religious affiliation, which is treated as sensitive personal data under the laws of a number of U.S. states. We collect and process such information only as strictly necessary to provide the App features that you request — never for advertising, profiling, or sale — and we do not sell sensitive personal data under any circumstances. Where the law of your state requires consent for the processing of sensitive personal data, we request that consent separately from your acceptance of the Terms of Use and this Policy, by a distinct opt-in presented when you create your account. You may withdraw that consent at any time by deleting your account or contacting {{PRIVACY_EMAIL}}, and we will cease the affected processing as soon as practicable and in no event later than fifteen (15) days after receiving your withdrawal.',
    ],
  },
  {
    n: 4,
    title: 'Advertisements in the App',
    body: [
      'The Masjid may choose to display advertisements from local businesses inside the App as a way to support itself. These advertisements are selected, priced, and supplied by the Masjid, are shown to the community generally, and are not targeted using your Personal Information.',
      'The App does not contain any third-party advertising software development kit, advertising network, or ad-serving tag. Advertising creative is uploaded by the Masjid and served from the platform’s own infrastructure. No advertiser receives any information about you from the App, and no advertiser can measure, track, or identify you through the App. Sahla does not operate an advertising network and does not share Personal Information with advertisers.',
    ],
  },
  {
    n: 5,
    title: 'How We Share Information',
    body: [
      'With the Masjid. Information you provide through the App — your account information, registrations, attendance, donations, and messages directed to the Masjid — is available to the Masjid’s authorized administrators so they can serve their community. Administrator access is role-based and limited to individuals the Masjid designates. The Masjid’s use of this information is governed by its own practices, by this Policy’s commitments, and by the data processing agreement described in Section 1.',
      'With service providers. We share information with vendors that perform services on the platform’s behalf, including payment processing (Stripe), cloud hosting, analytics, and push-notification delivery. Service providers are contractually restricted to using information only as necessary to provide services, are prohibited from selling it, and are prohibited from using it to train artificial-intelligence models.',
      'Legal, safety, and corporate transactions. We may disclose information to comply with law or legal process; to protect the rights, property, or safety of the Masjid’s community, Sahla, or the public; or in connection with a merger, acquisition, financing, or sale of assets, in which case information remains subject to this Policy or a successor policy no less protective, and we will provide notice of any material change before it takes effect.',
      'No sale, no ad-sharing. We do not sell Personal Information, and we do not share Personal Information for cross-context behavioral advertising. We do not use or disclose sensitive personal information for any purpose that would require a “right to limit” under California law.',
    ],
  },
  {
    n: 6,
    title: 'Content the Masjid Publishes Beyond the App',
    body: [
      'This Section concerns content the Masjid publishes. It does not concern your Personal Information, and nothing in it permits the disclosure of your account information, contact details, donation records, registrations, or private messages, which are never included.',
      'What may be published. The Masjid may choose to publish content it uploads to the App — such as lectures, recordings, images, and public announcements (“Masjid Content”) — beyond the App, so that it can reach a wider audience. This includes distribution through Sahla’s public content channels and successor or related Sahla products of substantially the same character, namely the public distribution of religious, educational, and community content. Publication for any materially different purpose requires advance notice and, where required by law, consent.',
      'The Masjid decides, and the Masjid warrants. Publication is at the Masjid’s election, on a per-item basis, and is off by default. By electing to publish an item, the Masjid represents and warrants that it owns or has the right to publish that content; that it has obtained all necessary releases and permissions from every individual who is identifiable in that content, including for use of their name, voice, image, and likeness; and that publication does not infringe any third party’s rights.',
      'Minors. It is Sahla’s policy not to publish Masjid Content beyond the App where an individual under 18 is identifiably depicted, and the Masjid is contractually required not to submit such content for publication. We screen submitted content for this purpose and remove any content brought to our attention that does not comply. Because content is supplied by the Masjid and screening cannot be perfect, we ask that you notify us at {{PRIVACY_EMAIL}} if you believe published content identifiably depicts a minor; we will remove it promptly upon verification.',
      'Your right to object. If you are identifiable in Masjid Content that has been published beyond the App and you did not consent, or you wish to withdraw consent, contact {{PRIVACY_EMAIL}}. We will remove the content from Sahla’s channels promptly upon verification and will notify the Masjid. Content the Masjid has independently published elsewhere is outside our control.',
      'This is not a sale of your information. Publication of Masjid Content is a publication of content chosen by the Masjid. It is not a sale or sharing of Personal Information, and no compensation is exchanged for Personal Information.',
    ],
  },
  {
    n: 7,
    title: 'Your Choices and Controls',
    body: [
      'Account information. You can review and update your account details at any time in the App.',
      'Notifications. You can manage push notifications in your device settings and manage email preferences using the unsubscribe link in any non-transactional email. We will still send transactional messages such as receipts and registration confirmations.',
      'Location. You can change or revoke the location permission at any time in your device settings, or set your city manually.',
      'Sensitive-data consent. You may withdraw the consent described in Section 3 at any time by contacting {{PRIVACY_EMAIL}} or by deleting your account.',
      'Account deletion. You can delete your account and request deletion of your data in three ways: in the App at Settings → Account → Delete Account; on the web at {{DELETE_ACCOUNT_URL}}; or by emailing {{PRIVACY_EMAIL}}. When you delete your account, we delete or de-identify your Personal Information, except for records we are required or permitted to retain as described in Section 8 — principally donation records the Masjid must keep for tax purposes. We will confirm completion of your deletion request.',
    ],
  },
  {
    n: 8,
    title: 'Data Retention',
    body: [
      'We retain Personal Information for no longer than reasonably necessary for the purposes described in this Policy. Specifically:',
      'Category',
      'Retention period',
      'Account and profile information',
      'Life of your account',
      'Program and event registration records',
      'Life of your account, or the period the Masjid requires for its records, whichever is shorter',
      'Donation and transaction records',
      'Up to seven (7) years, to satisfy tax, accounting, and legal requirements',
      'Automatically collected log and diagnostic data',
      'Up to twenty-four (24) months',
      'Support correspondence',
      'Up to twenty-four (24) months after resolution',
      'Backups',
      'Deleted information persists in encrypted backups for up to ninety (90) days and is not restored to active use',
      'The Masjid retains its own donation and program records independently of the App. When a retention period expires, or when you delete your account, we delete or de-identify the information.',
    ],
  },
  {
    n: 9,
    title: 'Security',
    body: [
      'We maintain administrative, technical, and physical safeguards designed to protect Personal Information against unauthorized access, disclosure, alteration, and destruction, including encryption of data in transit and at rest, access controls, and least-privilege practices, consistent with the reasonable-safeguards requirement of the New York SHIELD Act. Masjid administrator access is role-based and limited to individuals the Masjid authorizes, and administrators of one masjid cannot access the information of another. Card payments are handled by Stripe, which is certified as a PCI DSS Level 1 service provider. No method of transmission or storage is completely secure; in the event of a breach affecting your information, we will notify you and the appropriate regulators as required by applicable law, and we will assist the Masjid in meeting its own notification obligations.',
    ],
  },
  {
    n: 10,
    title: 'Children’s and Teens’ Privacy',
    body: [
      'Accounts require age 13 or older. Accounts in the App may be created only by individuals 13 years of age or older. We do not knowingly permit children under 13 to create accounts, and we do not knowingly collect Personal Information directly from children under 13. If you believe a child under 13 has created an account or provided Personal Information directly to the App, contact {{PRIVACY_EMAIL}} and we will delete it.',
      'Children registered for programs by a parent. Masjid programs often serve children, and the App allows a parent or legal guardian to register a child for a program from the parent’s own account. In that case, the child’s information is provided by the parent, not collected from the child. Consistent with the Children’s Online Privacy Protection Act, we collect this information with the parent’s knowledge and direct participation, and only as the program requires. Specifically:',
      'Information collected is limited to the child’s name, age or grade where the program requires it, and the program and session selected. As stated in Section 2, no health, allergy, medical, or disability information is collected.',
      'The information is used solely to administer the program.',
      'It is available only to the Masjid’s authorized administrators and to the service providers necessary to operate the App. It is never disclosed to any other third party, and never used for marketing, profiling, advertising, or sale.',
      'It is retained only as long as necessary to administer the program and meet legal requirements, and is then deleted or de-identified.',
      'A parent or legal guardian may review the child’s information, request its correction or deletion, and refuse to permit any further collection or use of it, at any time through their account or by contacting {{PRIVACY_EMAIL}}. Refusing further collection may mean the child cannot be registered for a program through the App.',
      'Teens (13–17). Where you are known to us to be between 13 and 17 years of age, we process your Personal Information only with your informed consent — requested clearly and separately when you create your account, and freely revocable at any time — or where processing is strictly necessary to provide the App features you request, consistent with the New York Child Data Protection Act and comparable laws. We never sell the Personal Information of anyone under 18, never use it for targeted advertising or profiling, never use it to train artificial-intelligence models, and never penalize any user for declining or withdrawing consent. We do not collect precise geolocation from users known to be under 18 for any purpose other than a feature the user affirmatively requests.',
    ],
  },
  {
    n: 11,
    title: 'Your U.S. State Privacy Rights',
    body: [
      'Depending on the U.S. state in which you reside, you may have the right to: (a) know and access the Personal Information collected about you, including in a portable format; (b) correct inaccurate Personal Information; (c) delete Personal Information; (d) opt out of the sale of Personal Information, the sharing or processing of Personal Information for targeted advertising, and profiling in furtherance of decisions producing legal or similarly significant effects — none of which we engage in; (e) limit the use of sensitive personal information, and withdraw consent to its processing; and (f) not receive discriminatory treatment for exercising your rights.',
      'Exercising your rights. You may submit a request in the App, on the web at {{PRIVACY_REQUEST_URL}}, or by emailing {{PRIVACY_EMAIL}}. Because the Masjid is the controller of community information, Sahla receives and verifies requests on the Masjid’s behalf and refers them to the Masjid for decision under the data processing agreement described in Section 1. We will verify your request using your account credentials and the email address or phone number on file. You will receive a response within forty-five (45) days of receipt, subject to any extension permitted by applicable law, of which we will notify you. Where permitted, you may use an authorized agent; we will require proof of the agent’s authorization and verification of your identity.',
      'Appeals. If a request is declined, we will explain why. You may appeal by replying to our response with “Appeal” in the subject line, and you will receive a written decision on your appeal within the period required by the law of your state (generally 45 or 60 days). If your appeal is denied, you may contact the Attorney General of your state; contact information will be provided with the appeal decision.',
      'California disclosures. In the preceding 12 months, the following categories of Personal Information have been collected through the platform: identifiers (name, email address, phone number, device identifiers, IP address); customer records (account information); commercial information (donation and registration history); internet or other electronic network activity (in-app usage and diagnostics); geolocation data (approximate location, only with permission); sensitive personal information limited to information that may reveal religious beliefs (donation and program participation); and inferences limited to program participation. Each category is collected from you directly and from your use of the App, for the business purposes described in Section 3, and is disclosed for business purposes only to the recipients described in Section 5. We have not sold or shared Personal Information, and we will not. We do not use or disclose sensitive personal information for purposes requiring a right to limit. We do not knowingly collect or sell the Personal Information of consumers under 16 years of age. California “Shine the Light”: we do not disclose Personal Information to third parties for their own direct marketing purposes.',
      'Opt-out preference signals. Because we do not sell Personal Information and do not share it for cross-context behavioral advertising, there is no sale or sharing to opt out of. Where required by law, we honor browser-based opt-out preference signals such as Global Privacy Control on our websites; they do not otherwise change how we process your information. We do not respond to browser “Do Not Track” signals.',
      'Nevada. Nevada residents may submit a verified request to opt out of the sale of covered information to {{PRIVACY_EMAIL}}. We do not sell covered information, and we will respond to any such request within sixty (60) days.',
      'Other states. Residents of Colorado, Connecticut, Virginia, Texas, Oregon, Montana, Delaware, and other states with comprehensive privacy laws may exercise the rights described above by the same methods.',
    ],
  },
  {
    n: 12,
    title: 'Third-Party Services',
    body: [
      'The App relies on third-party services, including Stripe for payment processing and Apple and Google services for app distribution, analytics, and push-notification delivery. The practices of these third parties are governed by their own privacy policies, which we encourage you to review. The App may contain links to the Masjid’s website or social media; those destinations are governed by their own practices.',
    ],
  },
  {
    n: 13,
    title: 'Changes to This Policy',
    body: [
      'We may amend this Policy from time to time. If we make material changes, we will provide notice through the App and by email at least ten (10) days before the changes take effect, and we will update the Effective Date and Version above. Prior versions remain available at {{ARCHIVE_URL}}. Your continued use of the App after the Effective Date of an amended Policy constitutes acceptance of the amendment, except where applicable law requires your affirmative consent, in which case we will obtain it.',
    ],
  },
  {
    n: 14,
    title: 'Contact Us',
    body: [
      'For privacy questions about the App and platform:',
      '{{SAHLA_ENTITY}} · Attn: Privacy · {{PRIVACY_EMAIL}}',
      'For questions about the Masjid’s programs, content, and community practices:',
      '{{MASJID_NAME}} · {{SUPPORT_EMAIL}}',
    ],
  },
];

export const LEGAL_DOCS: Record<LegalDocId, { titleKey: string; sections: LegalSection[] }> = {
  terms: { titleKey: 'legal.termsTitle', sections: TERMS_SECTIONS },
  privacy: { titleKey: 'legal.privacyTitle', sections: PRIVACY_SECTIONS },
};
