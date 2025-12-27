# Contributing to Sustainable Eco-Friendly Digital Nomads Directory

Thank you for your interest in contributing to our project! This document outlines our Git workflow and development process.

## Git Workflow

We follow a simplified version of Git Flow with these main branches:

- `main` - Production-ready code
- `develop` - Main development branch
- `feature/*` - New features and improvements
- `fix/*` - Bug fixes
- `release/*` - Release preparation

### Branch Naming Convention

- Feature branches: `feature/description-in-kebab-case`
- Bug fix branches: `fix/issue-description`
- Release branches: `release/v1.2.3`

## Development Process

1. **Start a Feature**


   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write your code
   - Follow the coding standards
   - Add tests where necessary


3. **Commit Changes**

   ```bash
   git add .

   git commit -m "type: descriptive message"
   ```

   Commit message types:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - style: Formatting, missing semi-colons, etc
   - refactor: Code refactoring
   - test: Adding tests

   - chore: Maintenance tasks

4. **Push Changes**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Create PR against `develop` branch
   - Fill in the PR template
   - Request review from team members
   - Ensure all automated checks pass



## Code Review Process

### For Authors
1. **Before Creating PR**
   - Run `pnpm lint` and fix all warnings/errors
   - Run `pnpm check-types` and resolve TypeScript errors
   - Run `pnpm test:unit` and ensure tests pass
   - Review your own code changes
   - Write clear PR description explaining what and why

2. **During Review**
   - Respond to feedback promptly and professionally

   - Make requested changes in new commits (don't force push)

   - Re-request review after addressing feedback
   - Keep discussions focused on the code

### For Reviewers
1. **Review Checklist**
   - [ ] Code follows [CODING_STANDARDS.md](./CODING_STANDARDS.md)
   - [ ] No TypeScript errors or ESLint warnings
   - [ ] Tests are included for new features
   - [ ] Documentation is updated if needed
   - [ ] No security vulnerabilities introduced
   - [ ] No performance regressions
   - [ ] Error handling is appropriate
   - [ ] Naming is clear and follows conventions

2. **Review Guidelines**
   - Be constructive and respectful in feedback

   - Explain the "why" behind suggestions
   - Approve minor changes, request changes for significant issues

   - Test the changes locally if needed
   - Focus on code quality, not personal preferences

### PR Size Guidelines
- **Keep PRs small**: Aim for < 400 lines of changes
- **Single purpose**: One feature or fix per PR
- **Break down large changes**: Create multiple related PRs

- **Draft PRs**: Use draft PRs for work-in-progress feedback

## Code Style


For detailed coding standards and best practices, see [CODING_STANDARDS.md](./CODING_STANDARDS.md).

**Quick reference:**
- Follow Prettier configuration for code formatting
- Use TypeScript for all new code with proper type safety
- Follow ESLint rules - address all warnings and errors

- Write meaningful, conventional commit messages
- Avoid `any` type - use specific types or `unknown`
- Follow naming conventions: PascalCase for components, camelCase for functions
- Document complex logic with clear comments


## Pre-commit Checks

The repository is set up with husky pre-commit hooks that run:
- Prettier formatting
- TypeScript type checking
- ESLint checks

Make sure all these checks pass before committing.

## Testing

- Write tests for new features
- Ensure existing tests pass
- Run `npm test` before submitting PR

## Changelog Process

We maintain a detailed changelog to track all notable changes. Follow these guidelines:

### When to Update the Changelog

- **Feature additions**: Add entry when opening PR for new features
- **Bug fixes**: Add entry for significant bug fixes
- **Breaking changes**: Always document breaking changes
- **Releases**: Update release sections during release preparation

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [Version] - YYYY-MM-DD
### Added
- New features
### Changed  
- Changes in existing functionality
### Deprecated
- Soon-to-be removed features
### Removed
- Removed features
### Fixed
- Bug fixes
### Security
- Security improvements
```

### Workflow

1. **During Development**
   - Add entries to the `[Unreleased]` section in CHANGELOG.md
   - Include brief description and reference relevant issues/PRs

2. **Before Release**
   - Move unreleased changes to new version section
   - Add release date
   - Update version links at bottom of changelog

3. **Release PR Process**
   - Release manager reviews and finalizes changelog
   - Changelog updates are part of the release PR
   - No separate changelog PRs needed

### Entry Guidelines

- Be concise but descriptive
- Use present tense ("Add feature" not "Added feature")  
- Reference issue/PR numbers when applicable
- Group related changes together
- Focus on user-facing changes

### Ownership

- **Developers**: Add entries for their changes
- **Release Manager**: Reviews and finalizes before release
- **Maintainers**: Ensure changelog quality in PR reviews

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing! 🌱
