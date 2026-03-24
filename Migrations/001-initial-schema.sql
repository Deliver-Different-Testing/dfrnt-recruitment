-- Initial schema for DFRNT Recruitment Portal
-- Note: EF Core handles schema creation via EnsureCreated/Migrate
-- This file is for reference and manual deployments

CREATE TABLE IF NOT EXISTS "DocumentTypes" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "IsRequired" BOOLEAN NOT NULL DEFAULT FALSE,
    "AppliesTo" VARCHAR(50) NOT NULL DEFAULT 'Applicant',
    "ValidityMonths" INT,
    "SortOrder" INT NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "Applicants" (
    "Id" SERIAL PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "Phone" VARCHAR(50),
    "Address" TEXT,
    "City" VARCHAR(100),
    "Region" VARCHAR(100),
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Applied',
    "AppliedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "StatusChangedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "VehicleType" VARCHAR(100),
    "HasOwnVehicle" BOOLEAN NOT NULL DEFAULT FALSE,
    "LicenseType" VARCHAR(50),
    "LicenseExpiry" TIMESTAMP,
    "PreferredRegions" TEXT,
    "Notes" TEXT,
    "Source" VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "ApplicantDocuments" (
    "Id" SERIAL PRIMARY KEY,
    "ApplicantId" INT NOT NULL REFERENCES "Applicants"("Id") ON DELETE CASCADE,
    "DocumentTypeId" INT NOT NULL REFERENCES "DocumentTypes"("Id"),
    "FileName" VARCHAR(500) NOT NULL,
    "FilePath" VARCHAR(1000) NOT NULL,
    "FileSize" BIGINT NOT NULL,
    "ContentType" VARCHAR(200) NOT NULL,
    "UploadedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ExpiryDate" TIMESTAMP,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "VerifiedBy" VARCHAR(100),
    "VerifiedDate" TIMESTAMP,
    "RejectionReason" TEXT
);

CREATE TABLE IF NOT EXISTS "RecruitmentStages" (
    "Id" SERIAL PRIMARY KEY,
    "ApplicantId" INT NOT NULL REFERENCES "Applicants"("Id") ON DELETE CASCADE,
    "Stage" VARCHAR(100) NOT NULL,
    "Notes" TEXT,
    "CreatedBy" VARCHAR(100),
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "RecruitmentNotes" (
    "Id" SERIAL PRIMARY KEY,
    "ApplicantId" INT NOT NULL REFERENCES "Applicants"("Id") ON DELETE CASCADE,
    "Content" TEXT NOT NULL,
    "CreatedBy" VARCHAR(100),
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Quizzes" (
    "Id" SERIAL PRIMARY KEY,
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "PassingScore" INT NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "TimeLimit" INT,
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "QuizQuestions" (
    "Id" SERIAL PRIMARY KEY,
    "QuizId" INT NOT NULL REFERENCES "Quizzes"("Id") ON DELETE CASCADE,
    "QuestionText" TEXT NOT NULL,
    "QuestionType" VARCHAR(50) NOT NULL DEFAULT 'MultiChoice',
    "Options" TEXT,
    "CorrectAnswer" VARCHAR(500) NOT NULL,
    "Points" INT NOT NULL DEFAULT 1,
    "SortOrder" INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "QuizAttempts" (
    "Id" SERIAL PRIMARY KEY,
    "ApplicantId" INT NOT NULL REFERENCES "Applicants"("Id") ON DELETE CASCADE,
    "QuizId" INT NOT NULL REFERENCES "Quizzes"("Id"),
    "StartedDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CompletedDate" TIMESTAMP,
    "Score" INT NOT NULL DEFAULT 0,
    "Passed" BOOLEAN NOT NULL DEFAULT FALSE,
    "TimeTaken" INT
);

CREATE TABLE IF NOT EXISTS "QuizAnswers" (
    "Id" SERIAL PRIMARY KEY,
    "AttemptId" INT NOT NULL REFERENCES "QuizAttempts"("Id") ON DELETE CASCADE,
    "QuestionId" INT NOT NULL REFERENCES "QuizQuestions"("Id"),
    "Answer" TEXT NOT NULL,
    "IsCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
    "Points" INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "TenantSettings" (
    "Id" SERIAL PRIMARY KEY,
    "CompanyName" VARCHAR(200) NOT NULL DEFAULT 'DFRNT',
    "LogoUrl" VARCHAR(500),
    "PrimaryColor" VARCHAR(20) NOT NULL DEFAULT '#3bc7f4',
    "WelcomeMessage" TEXT,
    "RequiredDocuments" TEXT,
    "ActiveQuizId" INT
);

-- Seed default tenant settings
INSERT INTO "TenantSettings" ("CompanyName", "PrimaryColor", "WelcomeMessage")
VALUES ('DFRNT', '#3bc7f4', 'Welcome to the DFRNT Recruitment Portal')
ON CONFLICT DO NOTHING;
