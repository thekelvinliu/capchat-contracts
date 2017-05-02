// contract abstractions
const CapChatLogic = artifacts.require('./CapChatLogic.sol');
const CapChatRegistry = artifacts.require('./CapChatRegistry.sol');
const CapChatUser = artifacts.require('./CapChatUser.sol');
const keys = require('signal-protocol').KeyHelper;

contract('Integrations', accounts => {
  // copy accounts
  const testAddrs = accounts.slice(1);
  // the deployed registry
  const CCR = CapChatRegistry.at('0x14d493280bcd6499793ca8ec5c2a3a76f8e87cae');
  const NUM_OTPKS = 5;
  const owner = accounts[0];
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
    it('can register, lookup, an deregister');
    // it('can register', async () => {
    //   // register users
    //   await alice.instance.register({ from: alice.account });
    //   await bob.instance.register({ from: bob.account });
    //   // check events
    //   const events = await new Promise((resolve, reject) => {
    //     const filter = CCR.allEvents({
    //       fromBlock: 0,
    //       toBlock: 'latest'
    //     });
    //     filter.get((err, logs) => (err) ? reject(err) : resolve(logs));
    //   });
    //   const added = events.filter(e => e.event === 'MappingAdded');
    //   // assert that the addresses are correct
    //   // assert.equal(added[0].args.caddr, alice.instance.address);
    //   // assert.equal(added[1].args.caddr, bob.instance.address);
    //   // have alice look up bob
    //   let user = alice;
    //   let other = bob;
    //   const res = await alice.instance.find(
    //     `0x${Buffer.from(other.username).toString('hex')}`,
    //     { from: alice.account }
    //   );
    //   assert.equal(added[1].args.caddr, res);
    // });
    // it('can lookup', async () => {
    //   // have alice look up bob
    //   let user = alice;
    //   let other = bob;
    //   const res = await alice.instance.find(
    //     `0x${Buffer.from(other.username).toString('hex')}`,
    //     { from: alice.account }
    //   );
    //   console.log(res);
    //   // have bob look up alice
    // });
    // it('can deregister');
  });
});
