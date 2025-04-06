import { HashStrategy } from './HashStrategy';
import { Sha256Strategy } from './strategies/Sha256Strategy';
import { TaggedSha256Strategy } from './strategies/TaggedSha256Strategy';

/**
 * HashStrategyType - Enumeration of available hash strategy types
 */
export enum HashStrategyType {
  SHA256 = 'sha256',
  TAGGED_SHA256 = 'tagged-sha256'
}

/**
 * HashStrategyFactory - Factory for creating hash strategy instances
 */
export class HashStrategyFactory {
  /**
   * Create a hash strategy of the specified type
   *
   * @param type - The type of strategy to create
   * @param options - Additional options (like tag for tagged hashing)
   * @returns A HashStrategy instance
   */
  public static createStrategy(type: HashStrategyType, options?: { tag?: string }): HashStrategy {
    switch (type) {
      case HashStrategyType.SHA256:
        return new Sha256Strategy();

      case HashStrategyType.TAGGED_SHA256:
        // Use provided tag or default to "Bitcoin_Transaction"
        const tag = options?.tag || "Bitcoin_Transaction";
        return new TaggedSha256Strategy(tag);

      default:
        throw new Error(`Unsupported hash strategy type: ${type}`);
    }
  }
}