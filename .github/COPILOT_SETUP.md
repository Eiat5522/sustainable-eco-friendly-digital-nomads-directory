# Copilot Instructions Configuration

## Overview

This repository has been configured with optimized GitHub Copilot instructions following official best practices documented in the GitHub Copilot community resources.

## Files

- **`.github/copilot-instructions.md`** - Main Copilot instructions file (optimized)
- **`.github/copilot-instructions-original.md`** - Backup of original comprehensive instructions
- **`.github/instructions/copilot-usage-guidelines.md`** - Additional prompt engineering guidelines
- **`.github/instructions/desktop-commander-usage-guidelines.instructions.md`** - Tool-specific guidelines

## Changes Made

### Structure Improvements
- **Reduced length**: From 335+ lines to ~120 lines for better focus
- **Clear sections**: Organized into logical, scannable sections
- **Actionable content**: Specific guidelines rather than general advice

### Added Best Practices
- **Prompt engineering guidelines**: Clear examples of good vs poor prompts
- **AI safety considerations**: Security, accessibility, and bias mitigation
- **Performance patterns**: Code splitting, caching, optimization strategies
- **Testing guidance**: Specific patterns for Jest and Playwright

### Project-Specific Context
- **Tech stack clarity**: Clear Next.js 15+, Sanity CMS, TypeScript focus
- **Architecture patterns**: Monorepo structure, API routes, authentication
- **Development workflow**: Package management with pnpm, testing strategy
- **Deployment guidance**: Vercel configuration, CI/CD patterns

## Benefits

1. **Faster Development**: More focused, actionable instructions
2. **Better Code Quality**: Specific patterns and best practices
3. **Consistency**: Clear standards for common development tasks
4. **Security**: Built-in security considerations and validation patterns
5. **Performance**: Optimization patterns baked into instructions

## Usage

The instructions automatically apply to all files in the repository (`applyTo: "**"`). 
Developers working with GitHub Copilot will benefit from:

- More accurate code suggestions aligned with project patterns
- Better understanding of project structure and conventions
- Consistent error handling and validation approaches
- Optimized performance patterns

## Validation

- ✅ Instructions follow GitHub Copilot best practices
- ✅ YAML frontmatter properly configured
- ✅ Project-specific context maintained
- ✅ Build process remains unaffected
- ✅ Backward compatibility with existing workflows

---

*Last updated: 2024 - Following GitHub Copilot coding agent best practices*