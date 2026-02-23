# Quick Publishing Guide

## Prerequisites

1. **npm Account**
   - Create account at <https://www.npmjs.com/signup>
   - Verify email
   - Set up 2FA (recommended)

2. **npm Token**
   - Go to <https://www.npmjs.com/settings/YOUR_USERNAME/tokens>
   - Create new "Automation" token
   - Add as GitHub secret: `NPM_TOKEN`

3. **GitHub Secrets**
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` (your npm automation token)

## Publishing Methods

### Option 1: Automatic (Tag Push)

```bash
# 1. Update version in package.json, CHANGELOG.md, etc.
npm version 1.0.0 --no-git-tag-version

# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.0.0"
git push

# 3. Create and push tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:

- Run tests
- Verify coverage (90%+)
- Build package
- Publish to npm
- Create GitHub release

### Option 2: Manual Trigger (GitHub UI)

1. Go to: Actions → Publish Package → Run workflow
2. Select branch: `main` or `master`
3. Enter version: `1.0.0` (without 'v')
4. Check "Create git tag"
5. Click "Run workflow"

### Option 3: Manual (Local)

```bash
# 1. Login to npm
npm login

# 2. Run tests
npm test

# 3. Build
npm run build

# 4. Publish
npm publish --access public
```

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Major (2.0.0)**: Breaking changes
- **Minor (1.1.0)**: New features (backward compatible)
- **Patch (1.0.1)**: Bug fixes (backward compatible)

## Pre-Release Checklist

- [ ] All tests pass: `npm test`
- [ ] Coverage ≥90%: `npm run test:coverage`
- [ ] Build succeeds: `npm run build`
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] Version bumped in package.json
- [ ] No uncommitted changes

## Post-Release

1. **Verify npm package:**

   ```bash
   npm view @rcommerz/logger-nextjs
   ```

2. **Test installation:**

   ```bash
   mkdir test-install && cd test-install
   npm init -y
   npm install @rcommerz/logger-nextjs@1.0.0
   ```

3. **Check GitHub release:**
   - Go to: <https://github.com/rcommerz/logger-nextjs/releases>

4. **Announce:**
   - Update dependent projects
   - Share release notes

## Troubleshooting

### "Package already exists"

- Version already published
- Bump version number

### "Authentication required"

- Check NPM_TOKEN is correct
- Verify token has publish permissions
- Check token not expired

### "Coverage below threshold"

- Add more tests
- Fix failing tests
- Check jest.config.js threshold

### "Build failed"

- Check TypeScript errors
- Verify dependencies installed
- Check tsconfig.json

## Rolling Back

If you need to deprecate a version:

```bash
npm deprecate @rcommerz/logger-nextjs@1.0.0 "Version deprecated due to critical bug"
```

To unpublish (within 72 hours):

```bash
npm unpublish @rcommerz/logger-nextjs@1.0.0
```

## Support

- Issues: <https://github.com/rcommerz/logger-nextjs/issues>
- npm: <https://www.npmjs.com/package/@rcommerz/logger-nextjs>
