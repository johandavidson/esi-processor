# Contributing

## CI publishing

On push of a version tag (`v*`, for example `v0.2.0`), GitHub Actions publishes a new npm package version.

Requirements:
- Repository secret `NPM_TOKEN` must be configured with publish access to npm.
- Tag version must match `package.json` version (for example tag `v0.2.0` and `"version": "0.2.0"`).
- `package.json` version must be bumped above the currently published npm version.

## Recommended branching and release workflow

For an open-source project with multiple maintainers, use feature branches and release branches.

### Branches
- `master`: protected stable branch.
- `feature/*`: regular development branches for fixes and features.
- `release/*`: short-lived stabilization branches, for example `release/0.2.0`.

### Day-to-day development
1. Create a feature branch from `master`.
2. Implement changes and open a pull request to `master`.
3. Merge only after review and passing CI.

### Creating a release
1. Create a release branch from `master` (for example `release/0.2.0`).
2. Run final stabilization work on that branch (docs, changelog, last fixes if needed).
3. Run `npm version <patch|minor|major>` on the release branch.
4. Push the release branch and the generated tag (the repository `postversion` script already pushes both).
5. The tag (`v*`) triggers npm publishing in GitHub Actions.
6. Merge the release branch back to `master` to keep branch history aligned.
