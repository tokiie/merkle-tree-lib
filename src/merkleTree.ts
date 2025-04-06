import * as crypto from 'crypto';

/**
 * MerkleTree class: builds a binary Merkle tree using tagged hashing (BIP-0340).
 * It can compute the Merkle root and generate proofs for given leaves.
 */
export class MerkleTree {
  private leafHashes: Buffer[];
  private levels: Buffer[][];  // levels[0] = leaf level (after any padding), levels[H] = [root]
  public root: Buffer = Buffer.alloc(0); // Initialize to avoid TS error

  private tagHashLeaf: Buffer;
  private tagHashBranch: Buffer;

  /**
   * Initialize the Merkle tree with an array of data (strings) and hashing tags.
   * @param leavesData - Array of strings representing leaf data.
   * @param leafTag - Tag for hashing leaves (context-specific tag). Defaults to "Bitcoin_Transaction".
   * @param branchTag - Tag for hashing internal nodes. Defaults to the same as leafTag.
   */
  constructor(leavesData: string[], leafTag: string = "Bitcoin_Transaction", branchTag: string = "Bitcoin_Transaction") {
    this.tagHashLeaf = this.computeTagHash(leafTag);
    this.tagHashBranch = this.computeTagHash(branchTag);

    // Compute all leaf hashes
    this.leafHashes = leavesData.map(data => {
      const msg = Buffer.from(data, 'utf8');
      return this.taggedHash(this.tagHashLeaf, msg);
    });

    // Build Merkle tree levels
    this.levels = [];
    this.buildTree();
  }

  /** Compute SHA256 hash of the tag (as UTF-8), used for tagged hashing. */
  private computeTagHash(tag: string): Buffer {
    return crypto.createHash('sha256').update(tag, 'utf8').digest();
  }

  /**
   * Compute a tagged hash: SHA256( tagHash || tagHash || message ).
   * @param tagHash - Buffer of 32-byte hash of the tag.
   * @param msg - Message bytes to hash.
   * @returns 32-byte SHA256 digest.
   */
  private taggedHash(tagHash: Buffer, msg: Buffer): Buffer {
    // Use two tagHash copies as prefix, then the message
    return crypto.createHash('sha256')
                 .update(tagHash)
                 .update(tagHash)
                 .update(msg)
                 .digest();
  }

  /** Build the Merkle tree levels and root from the leaf hashes. */
  private buildTree(): void {
    let levelNodes = this.leafHashes.slice();  // copy leaf hashes
    const n = levelNodes.length;
    if (n === 0) {
      // No leaves: define root as empty buffer
      this.root = Buffer.alloc(0);
      this.levels = [];
      return;
    }
    // If there's only one leaf, that leaf's hash will be the root (no pairing needed).
    // Otherwise, build the tree by hashing pairs of nodes up to the root.
    let levelIndex = 0;
    while (levelNodes.length > 1) {
      // If odd number of nodes, duplicate the last node to make it even
      if (levelNodes.length % 2 === 1) {
        levelNodes.push(levelNodes[levelNodes.length - 1]);
      }
      // Store the current level (after padding)
      this.levels[levelIndex] = levelNodes;

      // Compute parent level
      const nextLevel: Buffer[] = [];
      for (let i = 0; i < levelNodes.length; i += 2) {
        const left = levelNodes[i];
        const right = levelNodes[i + 1];
        // Branch hash using the branch tag
        const parentHash = this.taggedHash(this.tagHashBranch, Buffer.concat([left, right]));
        nextLevel.push(parentHash);
      }

      levelNodes = nextLevel;
      levelIndex++;
    }
    // The loop ends when levelNodes has a single element (root)
    this.levels[levelIndex] = levelNodes;
    this.root = levelNodes[0];
  }

  /**
   * Get the Merkle root as a hex string.
   * @returns Hexadecimal string of the Merkle root.
   */
  public getHexRoot(): string {
    return this.root.toString('hex');
  }

  /**
   * Generate the Merkle proof for the leaf at the given index.
   * @param index - Index of the target leaf in the original input array.
   * @returns An array of proof elements, each a tuple [siblingHash (Buffer), side (0 or 1)].
   *          side = 0 indicates the sibling is the left node, side = 1 indicates the sibling is the right node.
   */
  public getProof(index: number): { siblingHash: Buffer, side: 0 | 1 }[] {
    const proof: { siblingHash: Buffer, side: 0 | 1 }[] = [];
    if (index < 0 || index >= this.leafHashes.length) {
      return proof;  // index out of range, return empty proof
    }
    // Traverse from leaf level up to root (levels[0] to levels[h-1], where levels[h] is root)
    let currentIndex = index;
    for (let level = 0; level < this.levels.length - 1; level++) {
      const levelNodes = this.levels[level];
      const isEvenIndex = (currentIndex % 2 === 0);
      let siblingIndex: number;
      let side: 0 | 1;
      if (isEvenIndex) {
        // Current node is a left child, sibling is to the right
        siblingIndex = currentIndex + 1;
        // In case of a duplicated last node, siblingIndex may equal currentIndex
        // (but our building algorithm pads such that sibling always exists)
        side = 1;  // sibling is on the right side
      } else {
        // Current node is a right child, sibling is to the left
        siblingIndex = currentIndex - 1;
        side = 0;  // sibling is on the left side
      }
      const siblingHash = levelNodes[siblingIndex];
      proof.push({ siblingHash, side });
      // Move to the parent index for next level
      currentIndex = Math.floor(currentIndex / 2);
    }
    return proof;
  }
}