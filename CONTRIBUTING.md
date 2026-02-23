# Contributing to @rcommerz/logger-nextjs

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm
- Git

### Getting Started

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/logger-nextjs.git
   cd logger-nextjs
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run tests:**

   ```bash
   npm test
   npm run test:watch  # Watch mode
   npm run test:coverage  # With coverage
   ```

4. **Build the package:**

   ```bash
   npm run build
   ```

## Project Structure

```
logger-nextjs/
├── src/
│   ├── logger.ts          # Core logger class
│   ├── hooks.ts           # React hooks
│   ├── components.tsx     # React components
│   ├── types.ts           # TypeScript types
│   ├── index.ts           # Main export
│   └── __tests__/         # Test files
├── dist/                  # Built output (gitignored)
├── .github/
│   └── workflows/         # CI/CD workflows
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `chore/description` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new hook useLogAnalytics`
- `fix: resolve memory leak in batch logging`
- `docs: update README with examples`
- `chore: upgrade dependencies`
- `test: add tests for performance measurement`

### Code Style

- Use TypeScript
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Run `npm run lint` before committing
- Ensure all tests pass

### Testing

- Write tests for new features
- Maintain 90%+ code coverage
- Test in multiple React versions
- Test browser compatibility

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Pull Request Process

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes and commit:**

   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

3. **Push to your fork:**

   ```bash
   git push origin feature/my-feature
   ```

4. **Create a Pull Request:**
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Link any related issues
   - Request review

5. **Address feedback:**
   - Make requested changes
   - Push updates to your branch
   - PR will auto-update

### PR Checklist

- [ ] Tests pass locally
- [ ] Code coverage maintained (90%+)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] Follows existing code style

## Reporting Issues

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node.js version, React version, browser)
- Code samples or screenshots
- Error messages/stack traces

### Feature Requests

Include:

- Clear description of the feature
- Use case and motivation
- Example API (if applicable)
- Alternatives considered

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Release Process

Releases are managed by maintainers:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Push tag to trigger publish workflow
5. GitHub Actions publishes to npm

## Questions?

- Open an issue for questions
- Join discussions on GitHub
- Review existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
