import { MerkleTree } from '../src';

describe('MerkleTree Library (Bitcoin-style Merkle Root)', () => {
  it('computes the correct Merkle root for an odd number of leaves', () => {
    const leaves = ['aaa', 'bbb', 'ccc', 'ddd', 'eee'];
    // Using the tag "Bitcoin_Transaction" for both leaf and branch (Part 1)
    const tree = new MerkleTree(leaves, 'Bitcoin_Transaction');
    const rootHex = tree.getHexRoot();
    // Expected root was precomputed for these five leaves under the given tagging scheme
    const expectedRoot = '4aa906745f72053498ecc74f79813370a4fe04f85e09421df2d5ef760dfa94b5';
    expect(rootHex).toBe(expectedRoot);
  });

  it('matches known Merkle root for even number of leaves', () => {
    const leaves = ['aaa', 'bbb'];  // even number of leaves
    const tree = new MerkleTree(leaves, 'Bitcoin_Transaction');
    const rootHex = tree.getHexRoot();
    // Compute expected root: hash of ("aaa" and "bbb") under "Bitcoin_Transaction"
    const expectedRoot = '631bae42ba587408a741fa7d482a955d059caa471c5d66548d44a6ed234e782c';
    expect(rootHex).toBe(expectedRoot);
  });

  it('returns an empty root for no leaves', () => {
    const tree = new MerkleTree([], 'Bitcoin_Transaction');
    expect(tree.getHexRoot()).toBe('');  // empty string (no data)
  });
});
