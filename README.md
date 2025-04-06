# Merkle Tree Library

A TypeScript implementation of a binary Merkle tree with tagged hashing based on BIP-0340 standards. This library provides functionality to build Merkle trees, compute root hashes, and generate inclusion proofs.

## Features

- Binary Merkle tree construction from arbitrary string data
- Tagged hashing for leaves and internal nodes (BIP-0340 compliant)
- Customizable tag strings for different applications
- Merkle proof generation for membership verification
- Automatic padding for trees with odd numbers of leaves
- TypeScript declarations for better development experience

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

// Data to include in the Merkle tree
const data = [
  'account1:1000',
  'account2:5000',
  'account3:2500'
];

// Create a Merkle tree with default "Bitcoin_Transaction" tags
const tree = new MerkleTree(data);

// Get the Merkle root hash as a hex string
const rootHash = tree.getHexRoot();
console.log('Merkle Root:', rootHash);

// Generate a proof for the second item (index 1)
const proof = tree.getProof(1);
console.log('Proof for account2:', proof);
```

### Custom Tags

You can specify custom tags for leaf and branch nodes:

```typescript
// Using custom tags for a proof-of-reserve application
const leafTag = 'ProofOfReserve_Leaf';
const branchTag = 'ProofOfReserve_Branch';

const tree = new MerkleTree(data, leafTag, branchTag);
```

### Verifying Proofs

While the library doesn't include a built-in verification function, here's how to verify a proof:

```typescript
import * as crypto from 'crypto';

// Example function to verify a Merkle proof
function verifyProof(
  leafData: string,
  leafIndex: number,
  proof: { siblingHash: Buffer, side: 0 | 1 }[],
  merkleRoot: Buffer,
  leafTag: string = "Bitcoin_Transaction",
  branchTag: string = "Bitcoin_Transaction"
): boolean {
  // Compute the tag hashes
  const tagHashLeaf = crypto.createHash('sha256').update(leafTag, 'utf8').digest();
  const tagHashBranch = crypto.createHash('sha256').update(branchTag, 'utf8').digest();

  // Hash the leaf data
  const leafDataBuffer = Buffer.from(leafData, 'utf8');
  let currentHash = crypto.createHash('sha256')
                           .update(tagHashLeaf)
                           .update(tagHashLeaf)
                           .update(leafDataBuffer)
                           .digest();

  // Apply each proof element to compute the potential root
  for (const { siblingHash, side } of proof) {
    // Determine the order of concatenation based on side
    const left = side === 0 ? siblingHash : currentHash;
    const right = side === 0 ? currentHash : siblingHash;

    // Compute the parent hash
    currentHash = crypto.createHash('sha256')
                         .update(tagHashBranch)
                         .update(tagHashBranch)
                         .update(Buffer.concat([left, right]))
                         .digest();
  }

  // Check if the computed root matches the expected root
  return currentHash.equals(merkleRoot);
}

// Usage example
const tree = new MerkleTree(data, 'ProofOfReserve_Leaf', 'ProofOfReserve_Branch');
const proof = tree.getProof(1); // Get proof for the second item
const isValid = verifyProof(
  data[1],              // The original data
  1,                    // The index of the data
  proof,                // The Merkle proof
  tree.root,            // The Merkle root
  'ProofOfReserve_Leaf',
  'ProofOfReserve_Branch'
);

console.log('Proof verification result:', isValid);
```

## API Reference

### MerkleTree

#### Constructor

```typescript
constructor(leavesData: string[], leafTag: string = "Bitcoin_Transaction", branchTag: string = "Bitcoin_Transaction")
```

Creates a new Merkle tree from the provided data.

- `leavesData`: Array of strings to be included in the tree
- `leafTag`: Tag for hashing leaves (default: "Bitcoin_Transaction")
- `branchTag`: Tag for hashing internal nodes (default: "Bitcoin_Transaction")

#### Methods

##### getHexRoot

```typescript
getHexRoot(): string
```

Returns the Merkle root as a hexadecimal string.

##### getProof

```typescript
getProof(index: number): { siblingHash: Buffer, side: 0 | 1 }[]
```

Generates a proof for the leaf at the specified index.

- `index`: The index of the leaf in the original data array
- Returns: An array of proof elements, each containing:
  - `siblingHash`: The hash of the sibling node
  - `side`: 0 if the sibling is on the left, 1 if on the right

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