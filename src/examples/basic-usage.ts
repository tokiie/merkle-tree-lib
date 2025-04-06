/**
 * Basic usage example for Merkle Tree Library
 */
import { MerkleTree, MerkleProofVerifier } from '../';

// Sample data for demonstration
const transactions = [
  'tx1: Alice sends 1 BTC to Bob',
  'tx2: Bob sends 0.5 BTC to Charlie',
  'tx3: Alice sends 0.3 BTC to Dave',
  'tx4: Eve sends 0.2 BTC to Alice'
];

// Create a new Merkle tree with default TaggedSha256 strategies
const tree = new MerkleTree(transactions);

// Get the Merkle root
console.log('Merkle Root:', tree.getRootHex());
console.log('Tree Structure:');
console.log(JSON.stringify(tree.exportTree(), null, 2));

// Generate a proof for the second transaction
const txIndex = 1; // 'tx2: Bob sends 0.5 BTC to Charlie'
const proof = tree.generateProof(txIndex);

console.log('\nProof for transaction:', transactions[txIndex]);
console.log('Proof Elements:', proof.getElements().map(el => ({
  direction: el.direction === 0 ? 'LEFT' : 'RIGHT',
  siblingHash: el.siblingHash.toString('hex').substr(0, 8) + '...' // Abbreviated for display
})));

// Verify the proof
const verifier = new MerkleProofVerifier();
const isValid = verifier.verify(proof);

console.log('\nProof Verification:', isValid ? 'VALID ✓' : 'INVALID ✗');

// Try to verify with incorrect data
const incorrectProof = tree.generateProof(txIndex);
// Modify the proof by changing the leaf data
const incorrectLeafData = 'tx2: Bob sends 999 BTC to Charlie'; // Changed amount

// Create a new proof with the incorrect data but same elements and root
const fakeProof = new MerkleProofVerifier().verifySimple(
  incorrectLeafData,
  proof.getElements().map(el => [el.siblingHash.toString('hex'), el.direction]),
  tree.getRootHex()
);

console.log('\nTrying to verify manipulated data:', fakeProof ? 'VALID ✓' : 'INVALID ✗ (Expected)');

// Example of proof export for API
console.log('\nAPI-friendly proof format:');
const apiProof = proof.getElements().map(el => [
  el.siblingHash.toString('hex'),
  el.direction
]);
console.log(JSON.stringify(apiProof, null, 2));