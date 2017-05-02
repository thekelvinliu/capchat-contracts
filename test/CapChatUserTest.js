// user contract
const CapChatUser = artifacts.require('./CapChatUser.sol');
// require a unofficial, but node-friendly libsignal for now
const keys = require('signal-protocol').KeyHelper;

contract('CapChatUser', accounts => {
  // copy accounts
  const testAddrs = accounts.slice();
  // mock data
  const emptyKey = Buffer.from(new ArrayBuffer(32)).toString('hex');
  const NUM_OTPKS = 5;
  let alice;
  let bob;

  // functions
  const func = {
    checkKey(keyHex, actual) {
      // convert hex string representing the key to a buffer
      const keyBuf = Buffer.from(keyHex.replace('0x', ''), 'hex');
      // assert correct size
      assert.lengthOf(keyBuf, 32);
      // get actual buffer
      const actualBuf = Buffer.from(actual, 1);
      // assert buffers contain same bytes
      assert.isTrue(keyBuf.equals(actualBuf));
    },
    checkSig(hexArray, actual) {
      // convert array of hex strings representing the signature to plain hex
      const sigHex = hexArray.map(sig => sig.replace('0x', '')).join('');
      // convert to a buffer
      const sigBuf = Buffer.from(sigHex, 'hex');
      // assert correct size
      assert.lengthOf(sigBuf, 64);
      // get actual buffer
      const actualBuf = Buffer.from(actual);
      // assert buffers contain same bytes
      assert.isTrue(sigBuf.equals(actualBuf));
    }
  };

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

  describe('identityKey', () => {
    it('holds the correct key', () =>
      // iterate over test usernames
      Promise.all([alice, bob].map(async user =>
        func.checkKey(
          await user.instance.identityKey(),
          user.identityKey.pubKey
        )
      ))
    );
  });

  describe('signedPreKey', () => {
    it('holds the correct key', () =>
      // iterate over test usernames
      Promise.all([alice, bob].map(async user =>
        func.checkKey(
          await user.instance.signedPreKey(),
          user.signedPreKey.keyPair.pubKey
        )
      ))
    );
  });

  describe('getSignedPreKeySig', () => {
    it('returns the correct signature', () =>
      Promise.all([alice, bob].map(async user =>
        func.checkSig(
          await user.instance.getSignedPreKeySig(),
          user.signedPreKey.signature
        )
      ))
    );
  });

  describe('updateSignedPreKey', () => {
    let user;
    beforeEach('use bob for these tests', () => { user = bob; });
    it('updates signedPreKey and signedPreKeySig correctly', async () => {
      // generate a new signedPreKey
      const signedPreKey = await keys.generateSignedPreKey(user.identityKey, 1);
      // create corresponding strings
      const strings = {
        signedPreKey: Buffer.from(signedPreKey.keyPair.pubKey, 1)
          .toString('hex'),
        signedPreKeySig: [
          Buffer.from(signedPreKey.signature, 0, 32).toString('hex'),
          Buffer.from(signedPreKey.signature, 32).toString('hex')
        ]
      };
      // update the contract using new content
      const res = await user.instance.updateSignedPreKey(
        `0x${strings.signedPreKey}`,
        strings.signedPreKeySig.map(sig => `0x${sig}`),
        { from: user.account }
      );
      // assert the update went through
      assert.lengthOf(res.logs, 1);
      assert.equal(res.logs[0].event, 'SignedPreKeyUpdated');
      // assert actual contents are updated correctly
      func.checkKey(
        await user.instance.signedPreKey(),
        signedPreKey.keyPair.pubKey
      )
      func.checkSig(
        await user.instance.getSignedPreKeySig(),
        signedPreKey.signature
      )
      // make changes in mock data
      user.signedPreKey = signedPreKey;
      user.strings.signedPreKey = strings.signedPreKey;
      user.strings.signedPreKeySig = strings.signedPreKeySig;
    });
    it('does not allow anyone but the contract owner to update', async () => {
      // generate a new signedPreKey
      const signedPreKey = await keys.generateSignedPreKey(user.identityKey, 1);
      // create corresponding strings
      const strings = {
        signedPreKey: Buffer.from(signedPreKey.keyPair.pubKey, 1)
          .toString('hex'),
        signedPreKeySig: [
          Buffer.from(signedPreKey.signature, 0, 32).toString('hex'),
          Buffer.from(signedPreKey.signature, 32).toString('hex')
        ]
      };
      // iterate over accounts
      await Promise.all(testAddrs.map(async acc => {
        // update the contract using new content
        const res = await user.instance.updateSignedPreKey(
          `0x${strings.signedPreKey}`,
          strings.signedPreKeySig.map(sig => `0x${sig}`),
          { from: acc }
        );
        // assert the update failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'updateSignedPreKey');
      }));
    });
  });

  describe('addFriend', () => {
    it('successfully adds a new friend', () =>
      Promise.all([alice, bob].map(async user => {
        let res;
        // add alice
        res = await user.instance.addFriend(
          web3.toBigNumber(alice.account),
          { from: user.account }
        );
        assert.lengthOf(res.logs, 1);
        assert.equal(res.logs[0].args.friend, alice.account);
        // add bob
        res = await user.instance.addFriend(
          web3.toBigNumber(bob.account),
          { from: user.account }
        );
        assert.lengthOf(res.logs, 1);
        assert.equal(res.logs[0].args.friend, bob.account);
      }))
    );
    it('does not allow anyone but the contract owner to add a friend', () =>
      Promise.all(testAddrs.map(async acc => {
        const user = alice;
        // try to add to the friends list
        const res = await user.instance.addFriend(
          web3.toBigNumber(acc),
          { from: acc }
        );
        // assert that it failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'addFriend');
      }))
    );
  });

  describe('removeFriend', () => {
    let friend, user;
    beforeEach('use bob for these tests', () => {
      friend = alice;
      user = bob;
    });
    it('successfully removes an existing friend', async () => {
      // remove friend
      const res = await user.instance.removeFriend(
        web3.toBigNumber(friend.account),
        { from: user.account }
      );
      assert.lengthOf(res.logs, 1);
      assert.equal(res.logs[0].args.friend, friend.account);
    });
    it('does not allow anyone but the contract owner to remove a friend', () =>
      Promise.all(testAddrs.map(async acc => {
        // try to remove from the friends list
        const res = await user.instance.removeFriend(
          web3.toBigNumber(acc),
          { from: acc }
        );
        // assert that it failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'removeFriend');
      }))
    );
  });

  describe('getOneTimePreKey', () => {
    let friend, user;
    beforeEach('use bob for these tests', () => {
      friend = bob;
      user = alice;
    });
    it('returns correct keys', async () => {
      // iterate over public keys of oneTimePreKeys
      const pubKeys = user.oneTimePreKeys.map(obj => obj.keyPair.pubKey);
      for (let i = 0; i < pubKeys.length; i++) {
        const key = pubKeys[i];
        // get a key
        const res = await user.instance.getOneTimePreKey({
          from: friend.account
        });
        const keyEvents = res.logs.filter(log => log.event === 'OneTimePreKey');
        // there should only be a single event containing the key
        assert.lengthOf(keyEvents, 1);
        // this is inconsistent because the keys are sometimes out of order
        func.checkKey(keyEvents[0].args.otpk, key);
        // there should be no depletion events
        assert.lengthOf(
          res.logs.filter(log => log.event === 'OneTimePreKeysDepleted'),
          0
        );
        // calculate remaining
        const remaining = NUM_OTPKS - 1 - i;
        // check for OneTimePreKeysLow event
        if (remaining < 3) {
          const lowEvents = res.logs
            .filter(log => log.event === 'OneTimePreKeysLow');
          // assert there should only be one and the count is correct
          assert.lengthOf(lowEvents, 1);
          assert.isTrue(lowEvents[0].args.count.equals(remaining));
        }
      }
    });
    it('only allows friends to get keys', () =>
      Promise.all(testAddrs.map(async acc => {
        // try to get a key
        const res = await user.instance.getOneTimePreKey({
          from: acc
        });
        // assert that it failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'getOneTimePreKey');
      }))
    );
    it('emits depleted event when there are no more keys', async () => {
      // get a key
        const res = await user.instance.getOneTimePreKey({
          from: friend.account
        });
      // assert only one event and that it is OneTimePreKeysDepleted
      assert.lengthOf(res.logs, 1);
      assert.equal(res.logs[0].event, 'OneTimePreKeysDepleted');
    });
  });

  describe('addOneTimePreKeys', () => {
    it('successfully adds new keys when there are none', async () => {
      const user = alice;
      // generate keys
      const oneTimePreKeys = await Promise.all(
        [...Array(NUM_OTPKS).keys()].map(keys.generatePreKey)
      );
      const strings = {
        oneTimePreKeys: oneTimePreKeys
          .map(otpk => Buffer.from(otpk.keyPair.pubKey, 1).toString('hex'))
      };
      // send to contract
      const res = await user.instance.addOneTimePreKeys(
        strings.oneTimePreKeys,
        { from: user.account }
      );
      // assert there should only be one and the count is correct
      assert.lengthOf(res.logs, 1);
      assert.isTrue(res.logs[0].args.count.equals(NUM_OTPKS));
      // make changes in mock data
      // user.oneTimePreKeys = oneTimePreKeys;
      // user.strings.oneTimePreKeys = strings.oneTimePreKeys;
    });
    it('successfully adds new keys when there are some', async () => {
      const user = bob;
      // get keys
      const numKeys = 3;
      for (let i = 0; i < numKeys; i++)
        await user.instance.getOneTimePreKey({
          from: user.account
        });
      // generate new keys
      const oneTimePreKeys = await Promise.all(
        [...Array(numKeys).keys()].map(keys.generatePreKey)
      );
      const strings = {
        oneTimePreKeys: oneTimePreKeys
          .map(otpk => Buffer.from(otpk.keyPair.pubKey, 1).toString('hex'))
      };
      // send to contract
      const res = await user.instance.addOneTimePreKeys(
        strings.oneTimePreKeys,
        { from: user.account }
      );
      // assert there should only be one and the count is correct
      assert.lengthOf(res.logs, 1);
      assert.isTrue(res.logs[0].args.count.equals(NUM_OTPKS));
    });
    it('successfully adds new keys when there are many', async () => {
      const user = bob;
      // generate new keys
      const numKeys = 2;
      const oneTimePreKeys = await Promise.all(
        [...Array(numKeys).keys()].map(keys.generatePreKey)
      );
      const strings = {
        oneTimePreKeys: oneTimePreKeys
          .map(otpk => Buffer.from(otpk.keyPair.pubKey, 1).toString('hex'))
      };
      // send to contract
      const res = await user.instance.addOneTimePreKeys(
        strings.oneTimePreKeys,
        { from: user.account }
      );
      // assert there should only be one and the count is correct
      assert.lengthOf(res.logs, 1);
      assert.isTrue(res.logs[0].args.count.equals(NUM_OTPKS + numKeys));
    });
    it('does not allow anyone but the contract owner to update', async () => {
      const user = bob;
      // generate keys
      const oneTimePreKeys = await Promise.all(
        [...Array(NUM_OTPKS).keys()].map(keys.generatePreKey)
      );
      const strings = {
        oneTimePreKeys: oneTimePreKeys
          .map(otpk => Buffer.from(otpk.keyPair.pubKey, 1).toString('hex'))
      };
      // iterate over accounts
      await Promise.all(testAddrs.map(async acc => {
        // update the contract using new content
        const res = await user.instance.addOneTimePreKeys(
          strings.oneTimePreKeys,
          { from: acc}
        );
        // assert the update failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'addOneTimePreKeys');
      }));
    });
  });

  describe('isValid', () => {
    let user;
    beforeEach('use alice for these tests', () => { user = alice; });
    it('passes for normally-created users', () =>
      // iterate over test usernames
      Promise.all([alice, bob].map(async user =>
        assert.isTrue(await user.instance.isValid())
      ))
    );
    it('fails when username is an empty string', async () => {
      const ccu = await CapChatUser.new(
        '',
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when registrationID is 0', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        0,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when identityKey is empty', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${emptyKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when signedPreKey is empty', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${emptyKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when signedPreKeySig is empty', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${emptyKey}`),
        user.strings.oneTimePreKeys.map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when oneTimePreKeys is empty', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys.filter(otpk => false)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when oneTimePreKeys is short', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys
          .filter((e, i) => i < 2)
          .map(otpk => `0x${otpk}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when oneTimePreKeys has empty keys', async () => {
      const ccu = await CapChatUser.new(
        user.username,
        user.registrationID,
        `0x${user.strings.identityKey}`,
        `0x${user.strings.signedPreKey}`,
        user.strings.signedPreKeySig.map(sig => `0x${sig}`),
        user.strings.oneTimePreKeys
          .map((otpk, i) => `0x${(i % 2) ? otpk : emptyKey}`)
      );
      assert.isFalse(await ccu.isValid());
    });
    it('fails when nothing is passed to constructor', async () => {
      const ccu = await CapChatUser.new();
      assert.isFalse(await ccu.isValid());
    });
  });
});
