# Agent Notes

## Moodle Maturity Levels

The valid maturity levels for Moodle plugins are defined in the Moodle codebase in the file:

- `public/lib/classes/component.php` (newer Moodle versions)
- `lib/classes/component.php` (older Moodle versions)

This file contains the constants defining maturity levels such as MATURITY_ALPHA, MATURITY_BETA, MATURITY_RC, MATURITY_STABLE, etc.

The human-readable language strings for maturity levels are defined in:

- `public/lang/en/admin.php` (admin language file)

Look for string keys like:

- 'maturity50' => 'Alpha'
- 'maturity100' => 'Beta'
- 'maturity150' => 'Release candidate'
- 'maturity200' => 'Stable version'

When working with plugin maturity filtering, always refer to this file for the authoritative list of maturity constants and their values.

## Local Data Storage

For development and testing purposes, consider downloading a local copy of the pluglist JSON to avoid repeated API calls:

```bash
curl -sSfL "https://download.moodle.org/api/1.3/pluglist.php" -o pluglist.json
```

This ~14MB JSON file contains all plugin data and can be used for offline development. The current implementation uses filesystem caching for individual API responses, but storing the full dataset locally would eliminate upstream API dependencies entirely.

## Changelog Maintenance

**IMPORTANT**: Every commit must have a corresponding entry in CHANGELOG.md following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Process:

1. **Before committing**: Update CHANGELOG.md with the changes being made
2. **Commit message**: Should be concise but descriptive
3. **Changelog entry**: Should be detailed and categorized (Added, Changed, Fixed, etc.)
4. **Version bumps**: Update version in package.json and CHANGELOG.md when appropriate

### Categories to use:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related changes

### Example:

```
## [1.2.0] - 2025-11-04
### Added
- New tool for plugin maturity filtering
### Changed
- Improved caching mechanism for API responses
```
