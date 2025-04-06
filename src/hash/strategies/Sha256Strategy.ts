import { createHash } from 'crypto';
import { HashStrategy } from '../HashStrategy';

/**
 * Sha256Strategy - Implementation of HashStrategy using SHA-256 algorithm
 */
export class Sha256Strategy implements HashStrategy {
  /**
   * Calculate a SHA-256 hash for the input data
   *
   * @param data - The data to hash
   * @returns The computed SHA-256 hash as a Buffer
   */
  public hash(data: Buffer | string): Buffer {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    return createHash('sha256').update(dataBuffer).digest();
  }

  /**
   * Get the algorithm name
   *
   * @returns The string "SHA-256"
   */
  public getAlgorithmName(): string {
    return 'SHA-256';
  }
}