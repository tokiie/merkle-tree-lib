import crypto from 'crypto';

/**
 * HashStrategy - Interface for hash algorithm implementations
 * This allows for different hashing strategies to be used interchangeably
 */
export interface HashStrategy {
  /**
   * Calculate a hash for the input data
   *
   * @param data - The data to hash (Buffer or string)
   * @returns The computed hash as a Buffer
   */
  hash(data: Buffer | string): Buffer;

  /**
   * Get the name of the hashing algorithm
   *
   * @returns The algorithm name as a string
   */
  getAlgorithmName(): string;
}

/**
 * SHA-256 hash strategy implementation
 */
export class SHA256Strategy implements HashStrategy {
  readonly name = 'sha256';

  hash(data: Buffer | string): Buffer {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.createHash('sha256').update(buffer).digest();
  }

  getAlgorithmName(): string {
    return this.name;
  }
}

/**
 * SHA-512 hash strategy implementation
 */
export class SHA512Strategy implements HashStrategy {
  readonly name = 'sha512';

  hash(data: Buffer | string): Buffer {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.createHash('sha512').update(buffer).digest();
  }

  getAlgorithmName(): string {
    return this.name;
  }
}

/**
 * Keccak-256 hash strategy implementation (used in Ethereum)
 */
export class Keccak256Strategy implements HashStrategy {
  readonly name = 'keccak256';

  hash(data: Buffer | string): Buffer {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.createHash('sha3-256').update(buffer).digest();
  }

  getAlgorithmName(): string {
    return this.name;
  }
}

/**
 * Factory to create hash strategy instances
 */
export class HashStrategyFactory {
  static createStrategy(algorithm: 'sha256' | 'sha512' | 'keccak256'): HashStrategy {
    switch (algorithm) {
      case 'sha256':
        return new SHA256Strategy();
      case 'sha512':
        return new SHA512Strategy();
      case 'keccak256':
        return new Keccak256Strategy();
      default:
        throw new Error(`Unsupported hash algorithm: ${algorithm}`);
    }
  }
}