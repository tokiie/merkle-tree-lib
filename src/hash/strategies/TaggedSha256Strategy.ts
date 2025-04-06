import { createHash } from 'crypto';
import { HashStrategy } from '../HashStrategy';

/**
 * TaggedSha256Strategy - Implementation of HashStrategy using BIP-0340 tagged SHA-256
 * This implements tagged hashing as defined in BIP-0340: SHA256(SHA256(tag) || SHA256(tag) || msg)
 */
export class TaggedSha256Strategy implements HashStrategy {
  private readonly tag: string;
  private readonly tagHash: Buffer;

  /**
   * Initialize with a specific tag
   *
   * @param tag - Tag string to use for domain separation
   */
  constructor(tag: string) {
    this.tag = tag;
    this.tagHash = createHash('sha256').update(tag, 'utf8').digest();
  }

  /**
   * Calculate a tagged SHA-256 hash for the input data
   *
   * @param data - The data to hash
   * @returns The computed tagged SHA-256 hash as a Buffer
   */
  public hash(data: Buffer | string): Buffer {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

    // Apply the tagged hash: SHA256(tagHash || tagHash || msg)
    return createHash('sha256')
      .update(this.tagHash)
      .update(this.tagHash)
      .update(dataBuffer)
      .digest();
  }

  /**
   * Get the algorithm name including the tag
   *
   * @returns A descriptive string with the algorithm and tag
   */
  public getAlgorithmName(): string {
    return `Tagged-SHA-256(${this.tag})`;
  }

  /**
   * Get the tag used for this strategy
   *
   * @returns The tag string
   */
  public getTag(): string {
    return this.tag;
  }

  /**
   * Get the pre-computed tag hash
   *
   * @returns The tag hash as a Buffer
   */
  public getTagHash(): Buffer {
    return this.tagHash;
  }
}