# Git Setup Documentation

## Current Setup

### Version Control Structure
- Main repository initialized
- Git ignore patterns configured
- Branch strategy implemented (main, develop, feature branches)
- Pull request template added
- Contributing guidelines established

### Development Workflow
1. Main development occurs in feature branches
2. PRs are merged into develop
3. Release branches created from develop
4. Releases merged to main

### Code Quality Tools
1. **Prettier**
   - Configuration: `.prettierrc`
   - Enforces consistent code style
   - Integrated with pre-commit hooks

2. **ESLint**
   - Uses Next.js default configuration
   - Integrated with pre-commit hooks

3. **TypeScript**
   - Type checking in pre-commit hooks
   - Ensures type safety

### Pre-commit Hooks
- Format code with Prettier
- Run TypeScript type checking
- Run ESLint checks
- Prevent commits with failing checks

## Branch Structure
```
main
└── develop
    └── feature/image-optimization
```

## Next Steps

1. **For Developers**
   - Clone the repository
   - Run `npm install` in app-scaffold directory
   - Set up your IDE with Prettier and ESLint
   - Create feature branches from develop

2. **For New Features**
   - Create branch: `git checkout -b feature/your-feature`
   - Make changes and commit
   - Push and create PR against develop

3. **For Releases**
   - Create release branch from develop
   - Version bump and changelog
   - Merge to main with tag

## Common Commands

```bash
# Start new feature
git checkout develop
git pull
git checkout -b feature/your-feature

# Update feature branch
git checkout develop
git pull
git checkout feature/your-feature
git merge develop

# Create PR
git push -u origin feature/your-feature
# Then create PR on GitHub/GitLab
```

## Tips
- Always pull latest develop before creating feature branch
- Keep commits atomic and well-described
- Follow commit message conventions
- Run tests before pushing
- Squash commits before merging to develop
