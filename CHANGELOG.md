# Changelog

All notable changes to the merkle-tree-lib will be documented in this file.

## [2.0.0] - 2025-04-06

### Changed

- **Breaking Change**: Modified `HashStrategyFactory.createStrategy()` to use a default tag of "Bitcoin_Transaction" when creating a `TaggedSha256Strategy` without an explicit tag. Previously, this would throw an error requiring a tag to be provided.

### Fixed

- Updated expected Merkle root hash in tests to match the computed values with the default tag.
- Comprehensive test suite covering all major Merkle tree operations.

## [1.0.1] - Previous Release

Initial version with basic Merkle tree functionality.
