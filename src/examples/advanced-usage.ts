/**
 * Advanced usage example for Merkle Tree Library
 * Demonstrates custom hash strategies and tree updates
 */
import {
  MerkleTree,
  MerkleProofVerifier,
  HashStrategyFactory,
  HashStrategyType
} from '../';

// Example 1: Using factory to create hash strategies
console.log('=== EXAMPLE 1: CUSTOM HASH STRATEGIES ===');

// Sample data
const balances = [
  'account1:100.50',
  'account2:2500.75',
  'account3:0.05',
  'account4:7890.00',
  'account5:123.45'
];

// Create strategies using the factory
const leafStrategy = HashStrategyFactory.createStrategy(
  HashStrategyType.TAGGED_SHA256,
  { tag: 'BALANCE_LEAF' }
);

const branchStrategy = HashStrategyFactory.createStrategy(
  HashStrategyType.TAGGED_SHA256,
  { tag: 'BALANCE_BRANCH' }
);

// Create the tree with custom strategies
const balanceTree = new MerkleTree(balances, leafStrategy, branchStrategy);

console.log('Tree with custom hash strategies:');
console.log(`- Root: ${balanceTree.getRootHex()}`);
console.log(`- Leaf count: ${balanceTree.getLeafCount()}`);
console.log(`- Leaf hash strategy: ${leafStrategy.getAlgorithmName()}`);
console.log(`- Branch hash strategy: ${branchStrategy.getAlgorithmName()}`);

// Example 2: Tree updates and verification
console.log('\n=== EXAMPLE 2: TREE UPDATES ===');

// Generate a proof before update
const accountIdx = 2; // 'account3:0.05'
const originalProof = balanceTree.generateProof(accountIdx);
console.log(`Original account data: ${balances[accountIdx]}`);
console.log(`Original root: ${balanceTree.getRootHex()}`);

// Update the leaf
const updatedBalance = 'account3:150.00'; // Changed from 0.05 to 150.00
console.log(`\nUpdating to: ${updatedBalance}`);
balanceTree.updateLeaf(accountIdx, updatedBalance);
console.log(`New root after update: ${balanceTree.getRootHex()}`);

// Generate a new proof after update
const newProof = balanceTree.generateProof(accountIdx);

// Verify both proofs
const verifier = new MerkleProofVerifier(leafStrategy, branchStrategy);

const originalVerification = verifier.verify(originalProof);
console.log(`\nOriginal proof verification: ${originalVerification ? 'VALID ✓' : 'INVALID ✗ (Expected - root changed)'}`);

const newVerification = verifier.verify(newProof);
console.log(`New proof verification: ${newVerification ? 'VALID ✓' : 'INVALID ✗'}`);

// Example 3: Finding items and tree visualization
console.log('\n=== EXAMPLE 3: FINDING ITEMS & VISUALIZATION ===');

// Find an account by its data
const searchAccount = 'account5:123.45';
const foundIndex = balanceTree.findLeaf(searchAccount);
console.log(`Looking for "${searchAccount}": ${foundIndex >= 0 ? `Found at index ${foundIndex}` : 'Not found'}`);

// Tree visualization (simplified)
console.log('\nTree structure visualization:');

const levels = balanceTree.exportTree();
levels.forEach((level, i) => {
  const indent = ' '.repeat(Math.pow(2, levels.length - i - 1) - 1);
  const spacing = ' '.repeat(Math.pow(2, levels.length - i) - 1);

  const nodes = level.map(hash => hash.substring(0, 6) + '...');
  console.log(`${indent}${nodes.join(spacing)}`);
});