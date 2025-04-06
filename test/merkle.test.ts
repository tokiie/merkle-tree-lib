import { MerkleTree } from '../src';
import { HashStrategyFactory, HashStrategyType } from '../src/hash';
import { ProofDirection } from '../src/proof';

describe('MerkleTree Library', () => {
  describe('Tree Construction', () => {
    it('computes the correct Merkle root for an odd number of leaves', () => {
      const leaves = ['aaa', 'bbb', 'ccc', 'ddd', 'eee'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);
      const rootHex = tree.getRootHex();
      // Expected root was precomputed for these five leaves under the given tagging scheme
      const expectedRoot = '933e9966f817f6a916bb6cba82afaa696681fc3d5985f69ef6245232e7bd5e2d';
      expect(rootHex).toBe(expectedRoot);
    });

    it('matches known Merkle root for even number of leaves', () => {
      const leaves = ['aaa', 'bbb'];  // even number of leaves
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);
      const rootHex = tree.getRootHex();
      // Compute expected root: hash of ("aaa" and "bbb") under "Bitcoin_Transaction"
      const expectedRoot = '631bae42ba587408a741fa7d482a955d059caa471c5d66548d44a6ed234e782c';
      expect(rootHex).toBe(expectedRoot);
    });

    it('throws error when creating tree with no leaves', () => {
      expect(() => new MerkleTree([], HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256)))
        .toThrow('Cannot create a Merkle tree with no data');
    });

    it('handles single leaf correctly', () => {
      const leaves = ['single'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);
      expect(tree.getLeafCount()).toBe(1);
      expect(tree.getRootHex()).toBe(tree.getLeafHash(0).toString('hex'));
    });
  });

  describe('Proof Generation', () => {
    it('generates correct proof for first leaf', () => {
      const leaves = ['aaa', 'bbb', 'ccc', 'ddd'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);
      const proof = tree.generateProof(0);

      expect(proof.getLeafData()).toBe('aaa');
      expect(proof.getLeafIndex()).toBe(0);
      expect(proof.getElements()).toHaveLength(2); // Need 2 elements for 4 leaves

      // Verify first element (sibling of 'aaa' is 'bbb')
      const firstElement = proof.getElements()[0];
      expect(firstElement.direction).toBe(ProofDirection.RIGHT);

      // Verify second element (sibling of 'aaa'/'bbb' pair is 'ccc'/'ddd' pair)
      const secondElement = proof.getElements()[1];
      expect(secondElement.direction).toBe(ProofDirection.RIGHT);
    });

    it('generates correct proof for last leaf', () => {
      const leaves = ['aaa', 'bbb', 'ccc', 'ddd'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);
      const proof = tree.generateProof(3);

      expect(proof.getLeafData()).toBe('ddd');
      expect(proof.getLeafIndex()).toBe(3);
      expect(proof.getElements()).toHaveLength(2);

      // Verify first element (sibling of 'ddd' is 'ccc')
      const firstElement = proof.getElements()[0];
      expect(firstElement.direction).toBe(ProofDirection.LEFT);

      // Verify second element (sibling of 'ccc'/'ddd' pair is 'aaa'/'bbb' pair)
      const secondElement = proof.getElements()[1];
      expect(secondElement.direction).toBe(ProofDirection.LEFT);
    });

    it('throws error when generating proof for out-of-bounds index', () => {
      const leaves = ['aaa', 'bbb', 'ccc'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      expect(() => tree.generateProof(-1)).toThrow('Leaf index out of range');
      expect(() => tree.generateProof(3)).toThrow('Leaf index out of range');
    });
  });

  describe('Leaf Operations', () => {
    it('finds leaf by data', () => {
      const leaves = ['aaa', 'bbb', 'ccc'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      expect(tree.findLeaf('aaa')).toBe(0);
      expect(tree.findLeaf('bbb')).toBe(1);
      expect(tree.findLeaf('ccc')).toBe(2);
      expect(tree.findLeaf('not_found')).toBe(-1);
    });

    it('gets leaf data and hash', () => {
      const leaves = ['aaa', 'bbb', 'ccc'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      expect(tree.getLeaf(0)).toBe('aaa');
      expect(tree.getLeafHash(0).toString('hex')).toBe(hashStrategy.hash('aaa').toString('hex'));
    });

    it('throws error when accessing out-of-bounds leaf', () => {
      const leaves = ['aaa', 'bbb', 'ccc'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      expect(() => tree.getLeaf(-1)).toThrow('Leaf index out of range');
      expect(() => tree.getLeaf(3)).toThrow('Leaf index out of range');
      expect(() => tree.getLeafHash(-1)).toThrow('Leaf index out of range');
      expect(() => tree.getLeafHash(3)).toThrow('Leaf index out of range');
    });
  });

  describe('Tree Updates', () => {
    it('updates leaf and recomputes affected nodes', () => {
      const leaves = ['aaa', 'bbb', 'ccc', 'ddd'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      const originalRoot = tree.getRootHex();
      const newRoot = tree.updateLeaf(1, 'new_bbb').toString('hex');

      expect(newRoot).not.toBe(originalRoot);
      expect(tree.getLeaf(1)).toBe('new_bbb');

      // Verify the proof still works with the updated leaf
      const proof = tree.generateProof(1);
      expect(proof.getLeafData()).toBe('new_bbb');
    });

    it('throws error when updating out-of-bounds leaf', () => {
      const leaves = ['aaa', 'bbb', 'ccc'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      expect(() => tree.updateLeaf(-1, 'new')).toThrow('Leaf index out of range');
      expect(() => tree.updateLeaf(3, 'new')).toThrow('Leaf index out of range');
    });
  });

  describe('Tree Export', () => {
    it('exports tree structure correctly', () => {
      const leaves = ['aaa', 'bbb', 'ccc', 'ddd'];
      const hashStrategy = HashStrategyFactory.createStrategy(HashStrategyType.TAGGED_SHA256);
      const tree = new MerkleTree(leaves, hashStrategy);

      const exportedTree = tree.exportTree();

      // Should have 3 levels for 4 leaves
      expect(exportedTree).toHaveLength(3);

      // First level should have 4 leaves
      expect(exportedTree[0]).toHaveLength(4);

      // Second level should have 2 nodes
      expect(exportedTree[1]).toHaveLength(2);

      // Third level should have 1 root
      expect(exportedTree[2]).toHaveLength(1);

      // Root in export should match getRootHex
      expect(exportedTree[2][0]).toBe(tree.getRootHex());
    });
  });
});
