# Contributing to Sustainable Eco-Friendly Digital Nomads Directory

Thank you for your interest in contributing to our project! This document outlines our Git workflow and development process.

## Git Workflow

We follow a simplified version of Git Flow with these main branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
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

## Code Style

- Follow Prettier configuration
- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages

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

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing! 🌱
