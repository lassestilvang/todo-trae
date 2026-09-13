# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | ✅ Yes    |
| latest  | ✅ Yes    |

## Reporting a Vulnerability

We take security vulnerabilities seriously. Please report them responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report them by emailing the maintainer directly at: `lasse.stilvang@gmail.com`

Please include:
- A clear description of the vulnerability
- Steps to reproduce or proof-of-concept
- Potential impact assessment
- Suggested fix (if you have one)

You should receive a response within 48 hours. If the vulnerability is confirmed, we will work on a fix and coordinate release timing.

## Security Measures in Place

- **Dependency scanning**: `npm audit` runs on every CI build (critical level)
- **Automated updates**: Dependabot handles weekly dependency updates
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- **Error boundaries**: Production error reporting via Sentry
- **Type safety**: TypeScript strict mode throughout
- **Code review**: Required for all changes via CODEOWNERS

## Disclosure Policy

- We ask that you give us a reasonable time to fix the vulnerability before public disclosure
- We will acknowledge your contribution in the fix (if desired)
- We will not pursue legal action against researchers who report vulnerabilities in good faith
