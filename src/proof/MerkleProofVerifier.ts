import { HashStrategy } from '../hash/HashStrategy';
import { MerkleProof, MerkleProofElement, ProofDirection } from './MerkleProof';
import { TaggedSha256Strategy } from '../hash/strategies/TaggedSha256Strategy';
import { DEFAULT_TAGS } from '../tree/MerkleTree';

/**
 * MerkleProofVerifier - Class responsible for verifying Merkle proofs
 */
export class MerkleProofVerifier {
  private leafHashStrategy: HashStrategy;
  private branchHashStrategy: HashStrategy;

  /**
   * Initialize a verifier with the hash strategies
   *
   * @param leafHashStrategy - Strategy for hashing leaves (default: TaggedSha256 with 'MERKLE_LEAF' tag)
   * @param branchHashStrategy - Strategy for hashing branches (default: TaggedSha256 with 'MERKLE_BRANCH' tag)
   */
  constructor(
    leafHashStrategy: HashStrategy = new TaggedSha256Strategy(DEFAULT_TAGS.LEAF),
    branchHashStrategy: HashStrategy = new TaggedSha256Strategy(DEFAULT_TAGS.BRANCH)
  ) {
    this.leafHashStrategy = leafHashStrategy;
    this.branchHashStrategy = branchHashStrategy;
  }

  /**
   * Verify a Merkle proof
   *
   * @param proof - The proof to verify
   * @returns True if the proof is valid, false otherwise
   */
  public verify(proof: MerkleProof): boolean {
    const elements = proof.getElements();
    const leafData = proof.getLeafData();
    const expectedRoot = proof.getRootHash();

    // Calculate the leaf hash
    let currentHash = this.leafHashStrategy.hash(leafData);

    // Apply each proof element to compute the potential root
    for (const element of elements) {
      currentHash = this.applyProofElement(currentHash, element);
    }

    // Check if the computed root matches the expected root
    return currentHash.equals(expectedRoot);
  }

  /**
   * @deprecated Use verify() with MerkleProof objects instead
   * Legacy verification method for backward compatibility
   *
   * @param leafData - The original leaf data
   * @param proofPath - Array of {sibling, position} objects
   * @param expectedRoot - The expected Merkle root as hex string
   * @returns True if the proof is valid, false otherwise
   */
  public legacyVerify(
    leafData: string,
    proofPath: Array<{sibling: string, position: 'left' | 'right'}>,
    expectedRoot: string
  ): boolean {
    // Calculate the leaf hash
    let currentHash = this.leafHashStrategy.hash(leafData);

    // Apply each proof element from the legacy format
    for (const { sibling, position } of proofPath) {
      const siblingHash = Buffer.from(sibling, 'hex');
      const direction = position === 'left' ? ProofDirection.LEFT : ProofDirection.RIGHT;

      // Convert to the new element format and apply
      const element: MerkleProofElement = {
        siblingHash,
        direction
      };

      currentHash = this.applyProofElement(currentHash, element);
    }

    // Compare with expected root
    const rootBuffer = Buffer.from(expectedRoot, 'hex');
    return currentHash.equals(rootBuffer);
  }

  /**
   * Apply a single proof element to calculate the next hash
   *
   * @param currentHash - The current hash
   * @param element - The proof element to apply
   * @returns The next hash in the path
   */
  private applyProofElement(currentHash: Buffer, element: MerkleProofElement): Buffer {
    // Concatenate the hashes in the correct order based on direction
    const combinedData = element.direction === ProofDirection.LEFT
      ? Buffer.concat([element.siblingHash, currentHash])
      : Buffer.concat([currentHash, element.siblingHash]);

    // Apply the branch hash function
    return this.branchHashStrategy.hash(combinedData);
  }

  /**
   * Verify a proof with simplified inputs
   *
   * @param leafData - The original leaf data
   * @param proof - Array of proof elements
   * @param merkleRoot - The expected Merkle root
   * @returns True if valid, false otherwise
   */
  public verifySimple(
    leafData: string,
    proof: Array<[string, ProofDirection]>,
    merkleRoot: string
  ): boolean {
    // Convert string hashes to Buffer
    const elements = proof.map(([hash, direction]) => ({
      siblingHash: Buffer.from(hash, 'hex'),
      direction
    }));

    // Create a MerkleProof and verify it
    const merkleProof = new MerkleProof(
      leafData,
      0, // Index doesn't matter for verification
      elements,
      Buffer.from(merkleRoot, 'hex')
    );

    return this.verify(merkleProof);
  }

  /**
   * Set the leaf hash strategy
   *
   * @param strategy - The hash strategy to use for leaf nodes
   */
  public setLeafHashStrategy(strategy: HashStrategy): void {
    this.leafHashStrategy = strategy;
  }

  /**
   * Set the branch hash strategy
   *
   * @param strategy - The hash strategy to use for branch nodes
   */
  public setBranchHashStrategy(strategy: HashStrategy): void {
    this.branchHashStrategy = strategy;
  }
}