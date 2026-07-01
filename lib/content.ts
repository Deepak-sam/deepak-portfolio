// Single source of truth. All content is grounded in the provided resume.
// No fabricated metrics.

export const profile = {
  name: "Deepak Thangaraj",
  headline: "Senior IT Leader",
  subheadline: "Microsoft 365 & Cloud Infrastructure · Digital Transformation",
  taglines: [
    "Architect of Digital Workplaces",
    "19+ years steering enterprise infrastructure",
    "Zero Trust · M365 · Intune · Purview",
    "₹5 Cr budgets · 2,000+ endpoints · 10+ sites",
  ],
  location: "Chennai, India",
  email: "deepak.sam@gmail.com",
  phone: "+91 87545 35065",
  linkedin: "https://www.linkedin.com/in/deepaksam020",
  resumeUrl: "https://deepak-sam.github.io/resume/",
  summary:
    "Senior IT leader with 19+ years of progressive experience steering enterprise infrastructure, digital workplace transformation, and cloud-first security strategy across complex, multi-location organisations. Deep, hands-on expertise across the Microsoft 365 ecosystem — from Exchange Online and Microsoft Entra ID to Intune, Purview, and Zero Trust architecture.",
} as const;

export const present = {
  role: "Sr. Manager — IT Infrastructure",
  company: "Future Focus Infotech Pvt Ltd",
  period: "Feb 2022 — Present",
  location: "Chennai, India",
  stats: [
    { label: "Team", value: "15", unit: "IT professionals" },
    { label: "Budget", value: "₹5", unit: "Crore / year" },
    { label: "Endpoints", value: "2,000+", unit: "managed via Intune" },
    { label: "Locations", value: "10+", unit: "across India" },
  ],
  highlights: [
    "Own and govern a ₹5 Crore annual IT budget — vendor negotiations, capex/opex planning, contract lifecycle management.",
    "Architected IT infrastructure strategy across 10+ business locations nationwide with consistent policy enforcement.",
    "Built greenfield IT environments for multiple new business units — network topology → identity → endpoint onboarding.",
    "Deployed 2,000+ endpoints via Microsoft Intune, Entra ID, Conditional Access, and MFA.",
    "Designed DR/BC frameworks with hybrid cloud; Microsoft Purview (DLP, Sensitivity Labels), Zero Trust access controls.",
    "Developed PowerShell automation for user provisioning, licence reporting, compliance audits.",
  ],
} as const;

export const capabilities = [
  {
    id: "cloud",
    title: "Cloud & Digital Workplace",
    accent: "cyan",
    skills: [
      "Microsoft 365 (Exchange · SharePoint · OneDrive · Teams)",
      "Microsoft Entra ID (Azure AD)",
      "Identity & Access Management",
      "SSO & Passwordless Auth",
      "MFA Strategy",
    ],
  },
  {
    id: "security",
    title: "Security, Compliance & Data Protection",
    accent: "amber",
    skills: [
      "Microsoft Purview (DLP · Sensitivity Labels · Info Governance)",
      "Zero Trust access controls",
      "Endpoint security governance",
      "Email security controls",
      "Encryption (BitLocker · at-rest · in-transit)",
    ],
  },
  {
    id: "endpoint",
    title: "Endpoint & Mobility",
    accent: "cyan",
    skills: [
      "Microsoft Intune",
      "Mobile Device Management (MDM)",
      "BYOD security architecture",
      "Secure remote workforce enablement",
      "Device compliance & Conditional Access",
    ],
  },
  {
    id: "automation",
    title: "Automation & Operations",
    accent: "amber",
    skills: [
      "PowerShell automation",
      "IT operations workflow automation",
      "Administrative scripting & reporting",
      "System monitoring",
      "ITIL-aligned service management",
    ],
  },
] as const;

export const timeline = [
  {
    year: "2022 — Present",
    role: "Sr. Manager — IT Infrastructure",
    company: "Future Focus Infotech",
    note: "15-person team · ₹5 Cr budget · 10+ sites · 2,000+ endpoints",
  },
  {
    year: "2021 — 2022",
    role: "IT Manager",
    company: "Tiger Analytics",
    note: "Led enterprise migration to M365 + Azure · global 700-endpoint refresh",
  },
  {
    year: "2017 — 2020",
    role: "IT Manager",
    company: "ESP Engineering",
    note: "Windows Server, AD, SQL Server for 300+ users · WAN + Wi-Fi buildout",
  },
  {
    year: "2015 — 2017",
    role: "IT Manager",
    company: "Telliant Systems",
    note: "Endpoint lifecycle · patch management · service-desk governance",
  },
  {
    year: "2014 — 2015",
    role: "IT Supervisor",
    company: "Netcom Africa (Lagos)",
    note: "Supervised IT ops across international offices · HA server admin",
  },
  {
    year: "2013 — 2014",
    role: "Assistant IT Manager",
    company: "QuipServe",
    note: "Windows Server + AD + endpoint provisioning",
  },
  {
    year: "2009 — 2013",
    role: "Sr. Team Leader, Technical Support",
    company: "Concentrix",
    note: "Led enterprise escalation team · quality benchmarks · coaching",
  },
  {
    year: "2006 — 2009",
    role: "Escalation Lead, Technical Support",
    company: "CSS Corp",
    note: "First-level infra triage · high-severity SLA ownership",
  },
] as const;

export const caseStudies = [
  {
    title: "Greenfield IT for new business units",
    body: "Built network topology, server provisioning, identity management, and endpoint onboarding from scratch — enabling rapid, compliant operational launch.",
    metrics: ["Multiple sites", "Compliant on day 1", "Repeatable playbook"],
  },
  {
    title: "Zero Trust + Purview data protection",
    body: "Designed DR/BC frameworks with hybrid cloud. Implemented Microsoft Purview (DLP, Sensitivity Labels), Zero Trust access controls, email security across the M365 estate.",
    metrics: ["DLP", "Sensitivity Labels", "Conditional Access"],
  },
  {
    title: "Global 700-endpoint hardware refresh",
    body: "Executed hardware refresh covering 700+ endpoints within agreed budget and timeline — cross-region logistics, imaging, deployment without disruption to active engagements.",
    metrics: ["700+ devices", "On budget", "Zero downtime"],
  },
] as const;

export const credentials = [
  { title: "ITIL v4 Foundation", issuer: "Axelos · PeopleCert", status: "certified" },
  { title: "CISSP", issuer: "ISC²", status: "in progress" },
  { title: "MBA — Systems Management", issuer: "Bharathidasan University", status: "2026 — Present" },
  { title: "BBA", issuer: "Alagappa University", status: "2022 — 2025" },
  { title: "Cybersecurity Leadership", issuer: "Training", status: "completed" },
  { title: "IT Governance", issuer: "Training", status: "completed" },
] as const;

export const languages = [
  { name: "Tamil", level: "Native" },
  { name: "English", level: "Native" },
  { name: "Hindi", level: "Advanced" },
] as const;
