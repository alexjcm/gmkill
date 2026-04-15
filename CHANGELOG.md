# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-14

### Added
- Multi-ecosystem support: Node.js/JavaScript detection.
- Fast-cleaning of Node targets (`node_modules`, `.next`, `dist`, `.astro`, `.vercel`, etc.).
- CLI parameter support: Start scanning from any custom directory instead of default `~/` (e.g., `npx projclean .`).

### Changed
- Massively optimized concurrent `fs` operations to handle heavy JS projects safely without deep globbing.
- Restructured internal architecture for composite IDs enabling hybrid Java/Node.js monorepo support.

## [1.0.0] 2026-03-29

### Added
- Initial release.
- Interactive CLI for scanning Maven `target/` and Gradle `build/` folders.
- Concurrent size calculation and secure interactive TUI.
