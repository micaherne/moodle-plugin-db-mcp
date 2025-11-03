# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-03

### Added

- Initial MCP server implementation for querying the Moodle plugin database API
- `get_raw_pluglist` tool to fetch raw JSON data from the API
- `find_plugin_latest_version` tool with support for filtering by Moodle version number or release name
- Filesystem-based caching with 1-hour TTL and stale data fallback
- MCP settings support for configurable cache directory location
- JSON response parsing with comprehensive TypeScript interfaces
- Error handling and input validation for tool requests
- Cache status and management tools (`get_cache_status`, `clear_cache`)

### Changed

- Updated all references from "XML data" to "JSON data" to reflect the actual API response format

### Removed

- API version configuration setting (currently hardcoded to API 1.3; can be re-added when 1.4 is released)