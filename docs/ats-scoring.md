# ATS-style scoring

The score is a deterministic simulation designed for resume/JD comparison. It is not an employer's proprietary ATS score.

## Current weighting

- Keywords: 45%
- Semantic similarity: 20%
- Resume structure: 10%
- Achievement evidence: 10%
- Experience alignment: 10%
- Job-title alignment: 5%

## What the engine measures

1. **Keywords** — skills detected in both the JD and resume.
2. **Semantic similarity** — TF-IDF similarity between the full resume and JD.
3. **Structure** — presence of common resume sections such as Summary, Experience, Skills, Education, Projects, and Certifications.
4. **Achievement evidence** — measurable percentages, quantified results, and outcome-oriented action language.
5. **Experience alignment** — compares detected resume years against an explicit JD experience requirement when present.
6. **Job-title alignment** — checks whether relevant job-title terms from the JD appear in the resume.

## Matched / missing / related

- **Matched:** JD skills also evidenced in the resume.
- **Missing:** JD skills not found in the resume.
- **Related:** a limited set of deterministic relationships, such as Terraform being related to CloudFormation as IaC.
- Missing technologies are **never automatically added** to the resume.

## Improvement rule

Every applied AI rewrite must be rescanned. A rewrite is only considered an ATS improvement when the deterministic score actually increases.

The AI is a wording assistant, not the scoring authority.
