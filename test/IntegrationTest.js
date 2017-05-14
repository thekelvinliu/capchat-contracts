// contract abstractions
const CapChatLogic = artifacts.require('./CapChatLogic.sol');
const CapChatRegistry = artifacts.require('./CapChatRegistry.sol');
const CapChatUser = artifacts.require('./CapChatUser.sol');
const keys = require('signal-protocol').KeyHelper;

contract('Integrations', accounts => {
  // copy accounts
  const testAddrs = accounts.slice(1);
  // the deployed registry
  const CCR = CapChatRegistry.at('0x84f1ac740f64a034b0609f29d103d4aeb286cbf1');
  const NUM_OTPKS = 5;
  const owner = accounts[0];
  const zero = `0x${Buffer.alloc(20).toString('hex')}`;
  let alice;
  let bob;
  let logic;

  before('creates an initial logic contract', () =>
    CapChatLogic.new(0, 0, 1, { from: owner })
      .then(async instance => {
        // save the instance
        logic = instance;
        // set it with the registry
        const res = await CCR.updateLogic(logic.address, { from: owner });
        // assert the update went through
        assert.lengthOf(res.logs, 1);
        assert.equal(res.logs[0].event, 'NewLogic');
        assert.equal(res.logs[0].args.caddr, logic.address);
      })
  );

  before('creates information for mock users', () =>
    // iterate over test usernames
    Promise.all(['alice', 'bob'].map(async un => {
      // gather user information and generate keys
      const account = testAddrs.pop();
      const username = un;
      const registrationID = keys.generateRegistrationId();
      const identityKey = await keys.generateIdentityKeyPair();
      const signedPreKey = await keys.generateSignedPreKey(identityKey, 0);
      const oneTimePreKeys = await Promise.all(
        [...Array(NUM_OTPKS).keys()].map(keys.generatePreKey)
      );
      // create an object
      let user = {
        account,
        username,
        registrationID,
        identityKey,
        signedPreKey,
        oneTimePreKeys
      };
      // create hex string representations of public keys
      user.strings = {
        identityKey: Buffer.from(identityKey.pubKey, 1).toString('hex'),
        signedPreKey: Buffer.from(signedPreKey.keyPair.pubKey, 1)
          .toString('hex'),
        signedPreKeySig: [
          Buffer.from(signedPreKey.signature, 0, 32).toString('hex'),
          Buffer.from(signedPreKey.signature, 32).toString('hex')
        ],
        oneTimePreKeys: user.oneTimePreKeys
          .map(otpk => Buffer.from(otpk.keyPair.pubKey, 1).toString('hex'))
      };
      // create actual instances
      user.instance = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`),
        { from: user.account }
      );
      console.log(`${user.username}'s account is ${user.account}, contract is ${user.instance.address}`);
      // save the object
      eval(`${un} = user`);
    }))
  );

  describe('logic', () => {
    it('can be updated', async () => {
      // create a new logic contract
      const newLogic = await CapChatLogic.new(1, 0, 0, { from: owner });
      // update the registry
      const res = await CCR.updateLogic(newLogic.address, { from: owner });
      // assert the update went through
      assert.lengthOf(res.logs, 1);
      assert.equal(res.logs[0].event, 'NewLogic');
      assert.equal(res.logs[0].args.caddr, newLogic.address);
      // save the instance
      logic = newLogic;
    });
  });

  describe('users', () => {
    it('can register, lookup, an deregister', async () => {
      // some local variables
      const aliceBuf = `0x${Buffer.from(alice.username).toString('hex')}`;
      const bobBuf = `0x${Buffer.from(bob.username).toString('hex')}`;
      let res;
      // register users
      await Promise.all([alice, bob].map(user => user.instance.register({
        from: user.account
      })));
      // have alice and bob look up one another
      assert.equal(
        await alice.instance.find(bobBuf, { from: alice.account }),
        bob.instance.address
      );
      assert.equal(
        await bob.instance.find(aliceBuf, { from: bob.account }),
        alice.instance.address
      );
      // deregister users
      await Promise.all([alice, bob].map(user => user.instance.deregister({
        from: user.account
      })));
      // should now be zero
      assert.equal(
        await alice.instance.find(bobBuf, { from: alice.account }),
        zero
      );
      assert.equal(
        await bob.instance.find(aliceBuf, { from: bob.account }),
        zero
      );
    });
  });
});
