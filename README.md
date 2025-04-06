# Merkle Tree Library

A TypeScript implementation of a binary Merkle tree with tagged hashing based on BIP-0340 standards. This library provides functionality to build Merkle trees, compute root hashes, and generate inclusion proofs.

## Features

- Binary Merkle tree construction from arbitrary string data
- Tagged hashing for leaves and internal nodes (BIP-0340 compliant)
- Customizable tag strings for different applications
- Merkle proof generation for membership verification
- Automatic padding for trees with odd numbers of leaves
- TypeScript declarations for better development experience
- Default tags for easier implementation

## Installation

```bash
npm install merkle-tree-lib
```

Or if you're using it as a local package:

```bash
npm install file:../path/to/merkle-tree-lib
```

## Usage

### Basic Example

```typescript
import { MerkleTree } from 'merkle-tree-lib';
import { HashStrategyFactory, HashStrategyType } from 'merkle-tree-lib';

// Data to include in the Merkle tree
const data = [
  'account1:1000',
  'account2:5000',
  'account3:2500'
];

// Create hash strategy (uses default "Bitcoin_Transaction" tag if not specified)
const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);

// Create a Merkle tree with the hash strategy
const tree = new MerkleTree(data, hashStrategy);

// Get the Merkle root hash as a hex string
const rootHash = tree.getRootHex();
console.log('Merkle Root:', rootHash);

// Generate a proof for the second item (index 1)
const proof = tree.generateProof(1);
console.log('Proof for account2:', proof);
```

### Custom Tags

You can specify custom tags when creating the hash strategy:

```typescript
// Using custom tags for a proof-of-reserve application
const leafTag = 'ProofOfReserve_Leaf';
const branchTag = 'ProofOfReserve_Branch';

// Create hash strategies with custom tags
const leafHashStrategy = HashStrategyFactory.createStrategy(
  HashStrategyType.TAGGED_SHA256,
  { tag: leafTag }
);
const branchHashStrategy = HashStrategyFactory.createStrategy(
  HashStrategyType.TAGGED_SHA256,
  { tag: branchTag }
);

// Create the tree with custom hash strategies
const tree = new MerkleTree(data, leafHashStrategy, branchHashStrategy);
```

### Verifying Proofs

Here's how to verify a proof:

```typescript
import { HashStrategyFactory, HashStrategyType, ProofDirection } from 'merkle-tree-lib';

// Example function to verify a Merkle proof
function verifyProof(
  leafData: string,
  proof: Array<{ siblingHash: Buffer, direction: ProofDirection }>,
  merkleRoot: Buffer,
  tagName: string = "Bitcoin_Transaction"
): boolean {
  // Create the hash strategy (defaults to "Bitcoin_Transaction" if tag not specified)
  const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);

  // Hash the leaf data
  let currentHash = hashStrategy.hash(leafData);

  // Apply each proof element to compute the potential root
  for (const { siblingHash, direction } of proof) {
    // Combine hashes based on the direction
    const combinedData = direction === ProofDirection.LEFT
      ? Buffer.concat([siblingHash, currentHash])
      : Buffer.concat([currentHash, siblingHash]);

    // Compute the parent hash
    currentHash = hashStrategy.hash(combinedData);
  }

  // Check if the computed root matches the expected root
  return currentHash.equals(merkleRoot);
}

// Usage example
const tree = new MerkleTree(data, HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256));
const proof = tree.generateProof(1); // Get proof for the second item
const isValid = verifyProof(
  data[1],             // The original data
  proof.getElements(), // The proof elements
  tree.getRoot()       // The Merkle root
);

console.log('Proof verification result:', isValid);
```

## API Reference

### HashStrategyFactory

#### createStrategy

```typescript
static createStrategy(type: HashStrategyType, options?: { tag?: string }): HashStrategy
```

Creates a hash strategy with the specified type and options.

- `type`: The hash strategy type (e.g., `HashStrategyType.TAGGED_SHA256`)
- `options`: Additional options
  - `tag`: Tag for tagged hashing (default: "Bitcoin_Transaction" for TaggedSha256Strategy)

### MerkleTree

#### Constructor

```typescript
constructor(
  data: string[],
  leafHashStrategy: HashStrategy = new TaggedSha256Strategy("Bitcoin_Transaction"),
  branchHashStrategy: HashStrategy = new TaggedSha256Strategy("Bitcoin_Transaction")
)
```

Creates a new Merkle tree from the provided data.

- `data`: Array of strings to be included in the tree
- `leafHashStrategy`: Strategy for hashing leaves (default: TaggedSha256 with "Bitcoin_Transaction" tag)
- `branchHashStrategy`: Strategy for hashing internal nodes (default: TaggedSha256 with "Bitcoin_Transaction" tag)

#### Methods

##### getRootHex

```typescript
getRootHex(): string
```

Returns the Merkle root as a hexadecimal string.

##### generateProof

```typescript
generateProof(index: number): MerkleProof
```

Generates a proof for the leaf at the specified index.

- `index`: The index of the leaf in the original data array
- Returns: A MerkleProof object containing proof elements

## How It Works

### Tagged Hashing

The library uses BIP-0340 tagged hashing to prevent second preimage attacks:

```
tagged_hash(tag, msg) = SHA256(SHA256(tag) || SHA256(tag) || msg)
```

### Tree Construction

1. Compute hashes for all leaf nodes using the leaf tag
2. If there's an odd number of nodes at any level, duplicate the last node
3. For each pair of nodes, compute their parent by hashing their concatenation using the branch tag
4. Continue until only one node remains (the root)

### Merkle Proofs

A Merkle proof consists of the minimum set of sibling hashes needed to recompute the root hash. For each hash, the side (left or right) is also included to indicate how to combine with the computed hash.

## Use Cases

- **Proof of Reserve**: Exchanges can use this library to prove they control the claimed funds without revealing customer details
- **Certificate Transparency**: Verify the inclusion of a certificate in a log
- **Blockchain Systems**: Create and verify Merkle trees for transaction histories
- **Supply Chain**: Verify the inclusion of products in a distributed database
- **Data Integrity**: Efficiently verify large datasets through smaller proofs

## License

MIT