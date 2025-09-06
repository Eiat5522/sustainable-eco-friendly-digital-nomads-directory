---
title: "Specification: AI-Ready Process for Creating Specifications"
version: "1.0"
date_created: 2025-09-06
last_updated: 2025-09-06
owner: "repo-maintainers / documentation automation"
tags: ["process","design","ai-ready","specification","tooling"]
---

# Introduction

This specification defines a machine-readable, unambiguous process for creating AI-ready specification documents. Its goal is to provide a clear, repeatable pattern that automation (including Generative AI agents) can follow to produce specification markdown files that satisfy the repository's standards and the `create-specification` prompt documented in `.github/prompts/create-specification.prompt.md`.

## 1. Purpose & Scope

Purpose: Provide explicit rules, templates, and data contracts for generating new specification files that are safe for automated generation and consumption by Generative AI.

Scope:
- Applies to all new specification files created under the `/spec/` directory.
- Intended audience: repository contributors, documentation automation agents, and Generative AI assistants.
- Assumptions: the repository uses Markdown for specs and follows the front-matter and template in the referenced prompt file.

## 2. Definitions

- AI-Ready: Formatted and structured to be unambiguous and easily parsed by Generative AIs.
- Spec File: A Markdown file saved under `/spec/` named `spec-[a-z0-9-]+.md`.
- Front matter: YAML-like metadata at the top of the file containing title, version, date_created, last_updated, owner, and tags.
- Requirement ID: A short uppercase code (e.g., REQ-001) that uniquely identifies a requirement.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: All spec files must include front matter with `title`, `date_created` and `tags` at minimum.
- **REQ-002**: The spec filename must match the anchored regex `^spec-[a-z0-9-]+\.md$` and be placed in `/spec/`.
- **REQ-003**: The spec must include all sections from the template in `.github/prompts/create-specification.prompt.md` (Introduction; Purpose & Scope; Definitions; Requirements, Constraints & Guidelines; Interfaces & Data Contracts; Acceptance Criteria; Test Automation Strategy; Rationale & Context; Dependencies & External Integrations; Examples & Edge Cases; Validation Criteria; Related Specifications).
- **REQ-004**: Use clear, explicit language, avoid idioms, and define all acronyms (AI-Ready best practices).
+**REQ-005**: Each requirement must have a unique ID matching `^[A-Z]{3}-\d{3}$` (e.g., REQ-001). IDs must be unique across the document.
IDs must be unique across the document.
- **CON-001**: Do not reference repo-specific secrets or runtime-only environment details in the spec.
- **GUD-001**: Provide at least one example and one edge case for each major interface or data contract.
- **PAT-001**: Use Given-When-Then format for Acceptance Criteria where applicable.

## 4. Interfaces & Data Contracts

This section defines the data schema for metadata the spec generator or human author should produce.

SpecMetadata (YAML front matter):
- title: string (non-empty)
- version: string (optional)
- date_created: YYYY-MM-DD (required)
- last_updated: YYYY-MM-DD (optional)
- owner: string (optional)
- tags: array[string] (required)

SpecSections: array of objects with keys:

Keys (required unless noted):
- id: one of the canonical section ids
- title: string
- content: string
- order: integer (optional)
- metadata: object (optional)

Keys (required unless noted):
- id: one of the canonical section ids
- title: string
- content: string
- order: integer (optional)
- metadata: object (optional)

Canonical section ids (enforced):
- introduction
- purpose-scope
- definitions
- requirements-constraints-guidelines
- interfaces-and-data-contracts
- acceptance-criteria
- test-automation-strategy
- rationale-context
- dependencies-external-integrations
- examples-edge-cases
- validation-criteria
- related-specifications

Example file manifest:

```json
{
  "path": "/spec/spec-process-create-specification-for-ai.md",
  "metadata": {
    "title": "Specification: AI-Ready Process for Creating Specifications",
    "date_created": "2025-09-06",
    "tags": ["process", "design", "ai-ready", "specification", "tooling"]
  },
  "sections": [
+    { "id": "introduction", "title": "Introduction", "content": "..." }
  ]
}
```
## 5. Acceptance Criteria

- **AC-001**: Given a request to create a new spec with purpose P, When the generator runs, Then it shall produce a file in `/spec/` named `spec-${slug(P)}.md` that adheres to the filename pattern and contains the required front matter and sections.purpose P, When the generator runs, Then it shall produce a file in `/spec/` named `spec-${slug(P)}.md` that adheres to the filename pattern and contains the required front matter and sections.purpose P, When the generator runs, Then it shall produce a file in `/spec/` named `spec-p-...md` that adheres to the filename pattern and contains the required front matter and sections.
- **AC-002**: Given an existing spec, When the spec is parsed by a Generative AI, Then the AI must be able to identify all requirement IDs, sections, and front-matter metadata without external context.
- **AC-003**: The spec must contain at least one example and one edge case in the `Examples & Edge Cases` section.

## 6. Test Automation Strategy

- Test Levels: Unit (linting/parsing of front-matter and sections), Integration (end-to-end generation flow), E2E (validate AI can parse and use the spec).
- Frameworks: Use repository-standard tooling (e.g., Jest for JS-based tooling). If not present, prefer lightweight scripts that validate YAML front matter and Markdown section presence.
- CI/CD: Add a simple validation step in the repo CI that runs a `spec-validator` script which checks filename patterns, presence of front-matter keys, and required sections.
- Coverage: No numerical coverage requirement for docs, but automated checks must exist and run on PRs that modify `/spec/`.

## 7. Rationale & Context

Creating structured, AI-ready specification files enables reliable automation, consistent documentation, and safer consumption by Generative AIs. Keeping conventions minimal and explicit reduces ambiguity and misinterpretation.

## 8. Dependencies & External Integrations

Example:
- SpecMetadata (required keys only):
  - title: "Example Spec"
  - date_created: "2025-01-01"
  - tags: ["example"]
- SpecSections:
  - { id: "introduction", title: "Introduction", content: "..." }

Edge cases:
- Filename: purpose contains characters outside [a-z0-9-]; normalize to a safe slug and validate uniqueness.
- SpecMetadata: invalid date format or missing `tags`; validator must reject with a clear error.
- SpecSections: unknown `id` or duplicate `id`; validator must reject or map to a canonical id.must reject or map to a canonical id.## 9. Examples & Edge Cases

Example: Minimal spec front matter and required sections.

Edge case: Generating a spec for a purpose containing characters outside [a-z0-9-]; the generator should normalize the filename to a safe slug and validate uniqueness.

## 10. Validation Criteria

- The repository must include a `spec/` directory.
- Each spec file must pass `spec-validator` checks (filename pattern, required front-matter keys, required sections). CI must fail the PR on any validation error.

## 11. Related Specifications / Further Reading

- `.github/prompts/create-specification.prompt.md`


---

Notes:
- This file was generated to implement the prompt's template and best practices for AI-ready specs.
