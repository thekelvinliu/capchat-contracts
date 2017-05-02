// registry contract
const CapChatRegistry = artifacts.require('./CapChatRegistry.sol');
// use node's crypto library
const crypto = require('crypto');

contract('CapChatRegistry', accounts => {
  // copy accounts
  const testAddrs = accounts.slice();
  // mock data
  const owner = testAddrs.pop();
  const initLogic = testAddrs.pop();
  const newLogic = testAddrs.pop();
  const zero = `0x${Buffer.alloc(20).toString('hex')}`;
  let alice;
  let bob;
  let ccr;
  let logic;

  before('creates dummy data', () =>
    // create new registry
    CapChatRegistry.new({ from: owner })
      // save the instance
      .then(instance => {
        ccr = instance;
        logic = initLogic;
      })
      // set logic
      .then(() => ccr.updateLogic(logic, { from: owner }))
      // generate info for alice
      .then(async () => {
        const username = 'alice';
        const addr = await crypto.randomBytes(20);
        const caddr = `0x${addr.toString('hex')}`;
        alice = { username, caddr };
      })
      // generate info for bob
      .then(async () => {
        const username = 'bob';
        const addr = await crypto.randomBytes(20);
        const caddr = `0x${addr.toString('hex')}`;
        bob = { username, caddr };
      })
  );

  describe('logicContract', () => {
    it('holds the correct address', async () => {
      assert.equal(await ccr.logicContract(), logic);
    });
  });

  describe('updateLogic', () => {
    it('updates logicContract correctly', async () => {
      // update
      const res = await ccr.updateLogic(newLogic, { from: owner });
      // assert the update went through
      assert.lengthOf(res.logs, 1);
      assert.equal(res.logs[0].event, 'NewLogic');
      assert.equal(res.logs[0].args.caddr, newLogic);
      // save changes
      logic = newLogic;
    });
    it('does not allow anyone but the contract owner to update', async () => {
      // genereate new address
      const addr = await crypto.randomBytes(20);
      const newLogic = `0x${addr.toString('hex')}`;
      // update from all accounts
      await Promise.all(testAddrs.map(async acc => {
        const res = await ccr.updateLogic(newLogic, { from: acc });
        // assert the update failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'updateLogic');
      }))
    });
  });

  describe('add', () => {
    it('adds mappings correctly', () =>
      Promise.all([alice, bob].map(async user => {
        // map username to address
        const res = await ccr.add(
          `0x${Buffer.from(user.username).toString('hex')}`,
          user.caddr,
          { from: logic }
        );
        // assert the add was successful
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'MappingAdded');
        const actual = Buffer.from(log.args.username.replace('0x', ''), 'hex');
        const expected = Buffer.concat([Buffer.from(user.username)], 32);
        assert.isTrue(actual.equals(expected));
        assert.equal(log.args.caddr, user.caddr);
      }))
    );
    it('does not allow anyone but the current logic contract to add', () =>
      Promise.all(testAddrs.map(async acc => {
        const user = alice;
        // try to map username to address
        const res = await ccr.add(
          `0x${Buffer.from(user.username).toString('hex')}`,
          user.caddr,
          { from: acc }
        );
        // assert the add failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'add');
      }))
    );
  });

  describe('get', () => {
    it('gets mappings correctly', () =>
      Promise.all([alice, bob].map(async user => {
        // lookup address for username
        const caddr = await ccr.get(
          `0x${Buffer.from(user.username).toString('hex')}`,
          { from: logic }
        );
        // compare to actual address
        assert.equal(caddr, user.caddr);
      }))
    );
    it('does not allow anyone but the current logic contract to get', () =>
      Promise.all(testAddrs.map(async acc => {
        const user = bob;
        // try to get
        const caddr = await ccr.get(
          `0x${Buffer.from(user.username).toString('hex')}`,
          { from: acc }
        );
        // assert the address is zero
        assert.equal(caddr, zero);
      }))
    );
  });

  describe('remove', () => {
    it('removes mappings correctly', () =>
      Promise.all([alice, bob].map(async user => {
        // remove username
        const res = await ccr.remove(
          `0x${Buffer.from(user.username).toString('hex')}`,
          { from: logic }
        );
        // assert the remove was sucessful
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'MappingRemoved');
        const actual = Buffer.from(log.args.username.replace('0x', ''), 'hex');
        const expected = Buffer.concat([Buffer.from(user.username)], 32);
        assert.isTrue(actual.equals(expected));
        // lookup just to be sure
        const caddr = await ccr.get(
          `0x${Buffer.from(user.username).toString('hex')}`,
          { from: logic }
        );
        // should be zero now
        assert.equal(caddr, zero);
      }))
    );
    it('does not allow anyone but the current logic contract to remove', () =>
      Promise.all(testAddrs.map(async acc => {
        const user = alice;
        // try to map username to address
        const res = await ccr.remove(
          `0x${Buffer.from(user.username).toString('hex')}`,
          { from: acc }
        );
        // assert the remove failed
        assert.lengthOf(res.logs, 1);
        const log = res.logs[0];
        assert.equal(log.event, 'Unauthorized');
        assert.equal(log.args.from, acc);
        assert.equal(log.args.action, 'remove');
      }))
    );
  });
});
