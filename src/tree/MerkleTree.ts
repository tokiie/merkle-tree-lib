import { HashStrategy } from '../hash/HashStrategy';
import { MerkleProof, MerkleProofElement, ProofDirection } from '../proof/MerkleProof';
import { TaggedSha256Strategy } from '../hash/strategies/TaggedSha256Strategy';

/**
 * Default tag constants for hashing
 */
export const DEFAULT_TAGS = {
  LEAF: 'Bitcoin_Transaction',
  BRANCH: 'Bitcoin_Transaction'
};

/**
 * MerkleTree - Implementation of a Merkle tree data structure
 *
 * A Merkle tree is a binary tree of hashes where leaf nodes contain
 * hashes of data blocks, and non-leaf nodes contain hashes of their children.
 */
export class MerkleTree {
  /** Original data leaves */
  private readonly leaves: string[];

  /** Hash of the leaves */
  private readonly leafHashes: Buffer[];

  /** Tree structure - array of arrays, each inner array is a level in the tree */
  private readonly levels: Buffer[][];

  /** Strategy for hashing leaf nodes */
  private readonly leafHashStrategy: HashStrategy;

  /** Strategy for hashing branch nodes */
  private readonly branchHashStrategy: HashStrategy;

  /**
   * Create a new Merkle tree
   *
   * @param data - Array of data elements to include in the tree
   * @param leafHashStrategy - Strategy to use for hashing leaves (default: TaggedSha256 with 'MERKLE_LEAF' tag)
   * @param branchHashStrategy - Strategy to use for hashing branches (default: TaggedSha256 with 'MERKLE_BRANCH' tag)
   */
  constructor(
    data: string[],
    leafHashStrategy: HashStrategy = new TaggedSha256Strategy(DEFAULT_TAGS.LEAF),
    branchHashStrategy: HashStrategy = new TaggedSha256Strategy(DEFAULT_TAGS.BRANCH)
  ) {
    if (!data || data.length === 0) {
      throw new Error('Cannot create a Merkle tree with no data');
    }

    this.leaves = [...data]; // Store original data
    this.leafHashStrategy = leafHashStrategy;
    this.branchHashStrategy = branchHashStrategy;

    // Hash the leaves
    this.leafHashes = data.map(item => this.leafHashStrategy.hash(item));

    // Build the tree
    this.levels = this.buildTree(this.leafHashes);
  }

  /**
   * Build the Merkle tree from leaf hashes
   *
   * @param leafHashes - Array of leaf node hashes
   * @returns 2D array representing tree levels
   */
  private buildTree(leafHashes: Buffer[]): Buffer[][] {
    const levels: Buffer[][] = [];

    // Add leaf hashes as the first level
    levels.push([...leafHashes]);

    // Build subsequent levels until we reach the root
    while (levels[levels.length - 1].length > 1) {
      const currentLevel = levels[levels.length - 1];
      const nextLevel: Buffer[] = [];

      // Process pairs in the current level to build the next level up
      for (let i = 0; i < currentLevel.length; i += 2) {
        // If this is an odd end node with no pair, propagate it up
        if (i + 1 === currentLevel.length) {
          nextLevel.push(currentLevel[i]);
          continue;
        }

        // Combine the pair of nodes and hash them
        const combined = Buffer.concat([currentLevel[i], currentLevel[i + 1]]);
        const parentHash = this.branchHashStrategy.hash(combined);
        nextLevel.push(parentHash);
      }

      // Add the new level to our levels array
      levels.push(nextLevel);
    }

    return levels;
  }

  /**
   * Get the Merkle root hash
   *
   * @returns The root hash as a Buffer
   */
  public getRoot(): Buffer {
    // Root is the only element in the last level
    return this.levels[this.levels.length - 1][0];
  }

  /**
   * Get the Merkle root hash as a hex string
   *
   * @returns The root hash as a hex string
   */
  public getRootHex(): string {
    return this.getRoot().toString('hex');
  }

  /**
   * Generate a Merkle proof for a specific leaf
   *
   * @param index - Index of the leaf in the original data array
   * @returns A MerkleProof object
   * @throws Error if the index is out of bounds
   */
  public generateProof(index: number): MerkleProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index out of range: ${index}`);
    }

    const elements: MerkleProofElement[] = [];
    let currentIndex = index;

    // Collect sibling hashes for each level up to the root
    for (let level = 0; level < this.levels.length - 1; level++) {
      const levelNodes = this.levels[level];

      // Calculate sibling index (if even, sibling is right; if odd, sibling is left)
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      // Only add sibling if it exists at this level
      if (siblingIndex < levelNodes.length) {
        elements.push({
          siblingHash: levelNodes[siblingIndex],
          direction: isRightNode ? ProofDirection.LEFT : ProofDirection.RIGHT
        });
      }

      // Move up to the parent node index for the next level
      currentIndex = Math.floor(currentIndex / 2);
    }

    // Create the Merkle proof with the original data and collected elements
    return new MerkleProof(
      this.leaves[index],
      index,
      elements,
      this.getRoot()
    );
  }

  /**
   * Get the number of leaves in the tree
   *
   * @returns The count of leaf nodes
   */
  public getLeafCount(): number {
    return this.leaves.length;
  }

  /**
   * Get the original data leaf at the specified index
   *
   * @param index - Index in the original data array
   * @returns The original data string
   * @throws Error if the index is out of bounds
   */
  public getLeaf(index: number): string {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index out of range: ${index}`);
    }
    return this.leaves[index];
  }

  /**
   * Get the hash of the leaf at the specified index
   *
   * @param index - Index in the original data array
   * @returns The leaf hash as a Buffer
   * @throws Error if the index is out of bounds
   */
  public getLeafHash(index: number): Buffer {
    if (index < 0 || index >= this.leafHashes.length) {
      throw new Error(`Leaf index out of range: ${index}`);
    }
    return this.leafHashes[index];
  }

  /**
   * Check if the tree contains a specific leaf value
   *
   * @param data - The leaf data to check
   * @returns The index of the leaf if found, -1 otherwise
   */
  public findLeaf(data: string): number {
    return this.leaves.findIndex(leaf => leaf === data);
  }

  /**
   * Export the tree structure for visualization or debugging
   *
   * @returns 2D array of hex strings representing the tree
   */
  public exportTree(): string[][] {
    return this.levels.map(level =>
      level.map(hash => hash.toString('hex'))
    );
  }

  /**
   * Update a leaf and recompute affected tree nodes
   *
   * @param index - Index of the leaf to update
   * @param newData - New data for the leaf
   * @returns The new root hash
   * @throws Error if the index is out of bounds
   */
  public updateLeaf(index: number, newData: string): Buffer {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(`Leaf index out of range: ${index}`);
    }

    // Update the leaf data
    this.leaves[index] = newData;

    // Rehash the leaf
    this.leafHashes[index] = this.leafHashStrategy.hash(newData);
    this.levels[0][index] = this.leafHashes[index];

    // Recompute affected nodes
    let currentIndex = index;
    for (let level = 0; level < this.levels.length - 1; level++) {
      // Move up to the parent index
      const parentLevel = level + 1;
      const parentIndex = Math.floor(currentIndex / 2);

      // Get the pair of children (current node and its sibling)
      const levelNodes = this.levels[level];
      const isRightChild = currentIndex % 2 === 1;
      const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

      // If there's no sibling (odd end node), just propagate up
      if (siblingIndex >= levelNodes.length) {
        this.levels[parentLevel][parentIndex] = levelNodes[currentIndex];
      } else {
        // Otherwise compute the new parent hash from the pair
        const first = levelNodes[isRightChild ? siblingIndex : currentIndex];
        const second = levelNodes[isRightChild ? currentIndex : siblingIndex];

        const combined = Buffer.concat([first, second]);
        this.levels[parentLevel][parentIndex] = this.branchHashStrategy.hash(combined);
      }

      // Update the current index for the next level
      currentIndex = parentIndex;
    }

    // Return the new root
    return this.getRoot();
  }
}