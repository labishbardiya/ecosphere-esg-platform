-- Phase 3+: Social, Governance, scoring, notifications, org settings
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_settings (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS csr_activities (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  "categoryId" integer,
  location text,
  "organizerId" text,
  capacity integer,
  "startDate" timestamp,
  "endDate" timestamp,
  "pointsReward" integer NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'upcoming',
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS csr_participation (
  id serial PRIMARY KEY,
  "activityId" integer NOT NULL REFERENCES csr_activities(id) ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  "proofUrl" text,
  "pointsEarned" integer NOT NULL DEFAULT 0,
  "completedAt" timestamp,
  "reviewedBy" text,
  "reviewedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policies (
  id serial PRIMARY KEY,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  content text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  "publishedAt" timestamp,
  "createdBy" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id serial PRIMARY KEY,
  "policyId" integer NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  "acknowledgedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audits (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  "departmentId" integer,
  status text NOT NULL DEFAULT 'scheduled',
  "scheduledDate" date,
  "completedDate" date,
  findings text,
  recommendations text,
  "createdBy" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_issues (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  "auditId" integer,
  severity text NOT NULL DEFAULT 'medium',
  "ownerId" text NOT NULL,
  "departmentId" integer,
  "dueDate" date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  "createdBy" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "resolvedAt" timestamp
);

CREATE TABLE IF NOT EXISTS department_scores (
  id serial PRIMARY KEY,
  "departmentId" integer NOT NULL,
  "periodMonth" date NOT NULL,
  "environmentalScore" numeric(6,2) NOT NULL DEFAULT 0,
  "socialScore" numeric(6,2) NOT NULL DEFAULT 0,
  "governanceScore" numeric(6,2) NOT NULL DEFAULT 0,
  "totalScore" numeric(6,2) NOT NULL DEFAULT 0,
  "computedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  href text,
  "isRead" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Default org settings (Section 8 toggles + ESG weights)
INSERT INTO org_settings (key, value) VALUES
  ('weight_environmental', '0.4'),
  ('weight_social', '0.3'),
  ('weight_governance', '0.3'),
  ('require_csr_evidence', 'true'),
  ('badge_auto_award', 'true'),
  ('notify_compliance', 'true'),
  ('notify_csr_decisions', 'true'),
  ('notify_badge_unlocks', 'true'),
  ('notify_policy_reminders', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO categories (name, type) VALUES
  ('Community Service', 'csr'),
  ('Education', 'csr'),
  ('Environment', 'csr'),
  ('Health & Wellness', 'csr'),
  ('Environmental', 'challenge'),
  ('Social', 'challenge'),
  ('Governance', 'challenge')
ON CONFLICT DO NOTHING;
