# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The DeepTerm team takes security issues seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- **Email**: Send details to the repository maintainers through GitHub
- **Private Security Advisory**: Use GitHub's private vulnerability reporting feature

### What to Include

When reporting a vulnerability, please include:

1. **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
2. **Full paths** of source file(s) related to the manifestation of the issue
3. **Location** of the affected source code (tag/branch/commit or direct URL)
4. **Special configuration** required to reproduce the issue
5. **Step-by-step instructions** to reproduce the issue
6. **Proof-of-concept or exploit code** (if possible)
7. **Impact** of the issue, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Initial Assessment**: We'll provide an initial assessment within 5 business days
- **Status Updates**: We'll keep you informed of our progress
- **Resolution**: We aim to resolve critical issues within 30 days

### Disclosure Policy

- We'll work with you to understand and resolve the issue quickly
- We'll coordinate disclosure with you to ensure users have time to update
- We'll credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version of DeepTerm
2. **API Keys**: Store your Gemini API key securely and never share it
3. **Browser Security**: Use an updated browser with security features enabled
4. **Local Storage**: Be aware that data is stored locally in your browser

### For Contributors

1. **Input Validation**: Always validate and sanitize user inputs
2. **XSS Prevention**: Use proper escaping for user-generated content
3. **Dependencies**: Keep dependencies updated and audit for vulnerabilities
4. **API Security**: Implement proper error handling for API calls
5. **Client-Side Security**: Remember that client-side code is visible to users

## Known Security Considerations

### Client-Side API Keys
- DeepTerm uses client-side storage for API keys for convenience
- Users should treat their API keys as sensitive information
- We recommend using API keys with appropriate restrictions when possible

### Local Data Storage
- User data is stored in browser local storage
- Data is not encrypted at rest in local storage
- Users should be aware of shared computer security implications

### Third-Party Dependencies
- We regularly audit dependencies for known vulnerabilities
- Security updates are prioritized in our release schedule

## Security Features

### Content Security Policy (CSP)
- Strict CSP headers to prevent XSS attacks
- Limited script sources to trusted origins only

### Data Handling
- No user data is transmitted to our servers
- All processing happens client-side for privacy

### API Integration
- Secure HTTPS connections for all external API calls
- Proper error handling to prevent information leakage

## Security Updates

Security updates will be:
- Released as soon as possible after confirmation
- Clearly marked in release notes
- Communicated through appropriate channels

## Bug Bounty

Currently, we do not have a formal bug bounty program. However, we greatly appreciate security researchers who help us improve DeepTerm's security and will publicly acknowledge your contributions (with your permission).

---

Thank you for helping keep DeepTerm and our users safe! 🛡️
