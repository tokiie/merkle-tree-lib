/**
 * Direction enum for which side the sibling is on in a Merkle proof
 */
export enum ProofDirection {
  LEFT = 0,
  RIGHT = 1
}

/**
 * MerkleProofElement - A single element in a Merkle proof
 */
export interface MerkleProofElement {
  /** The hash of the sibling node */
  siblingHash: Buffer;

  /** Direction (left or right) indicating which side the sibling is on */
  direction: ProofDirection;
}

/**
 * MerkleProof - Class representing a Merkle proof for a specific leaf
 */
export class MerkleProof {
  /** The original leaf data */
  private readonly leafData: string;

  /** The index of the leaf in the tree */
  private readonly leafIndex: number;

  /** Array of proof elements */
  private readonly elements: MerkleProofElement[];

  /** Merkle root hash (expected result after applying proof) */
  private readonly rootHash: Buffer;

  /**
   * Create a new Merkle proof
   *
   * @param leafData - The original data for the leaf
   * @param leafIndex - The index of the leaf in the original data array
   * @param elements - Array of proof elements
   * @param rootHash - The Merkle root hash
   */
  constructor(
    leafData: string,
    leafIndex: number,
    elements: MerkleProofElement[],
    rootHash: Buffer
  ) {
    this.leafData = leafData;
    this.leafIndex = leafIndex;
    this.elements = elements;
    this.rootHash = rootHash;
  }

  /**
   * Get the leaf data
   * @returns The original leaf data
   */
  public getLeafData(): string {
    return this.leafData;
  }

  /**
   * Get the leaf index
   * @returns The index of the leaf in the original tree
   */
  public getLeafIndex(): number {
    return this.leafIndex;
  }

  /**
   * Get the proof elements
   * @returns Array of proof elements
   */
  public getElements(): MerkleProofElement[] {
    return this.elements;
  }

  /**
   * Get the Merkle root hash
   * @returns The root hash
   */
  public getRootHash(): Buffer {
    return this.rootHash;
  }

  /**
   * Convert a proof from the library format to our standard format
   *
   * @param libProof - Proof from merkle-tree-lib's old format
   * @returns MerkleProofElement array
   */
  public static fromLibraryFormat(
    libProof: Array<{ siblingHash: Buffer, side: 0 | 1 }>
  ): MerkleProofElement[] {
    return libProof.map(item => ({
      siblingHash: item.siblingHash,
      direction: item.side as ProofDirection
    }));
  }

  /**
   * Convert a standard proof to a format suitable for API responses
   *
   * @param proof - MerkleProofElement array
   * @returns Array of [hashHex, direction] tuples
   */
  public static toApiFormat(proof: MerkleProofElement[]): [string, ProofDirection][] {
    return proof.map(item => {
      const hashHex = item.siblingHash.toString('hex');
      return [hashHex, item.direction];
    });
  }
}