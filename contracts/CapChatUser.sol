pragma solidity ^0.4.8;

import './CapChatRegistry.sol';
import './Logic.sol';

/// @title CapChatUser
/// @author thekelvinliu <kelvin@thekelvinliu.com>
contract CapChatUser {
  // variables
  /// address of the deployed registry contract
  address constant registry = 0x14d493280bcd6499793ca8ec5c2a3a76f8e87cae;
  /// owner of this user contract
  address owner;
  /// the username associated with this contract
  bytes32 username;
  /// the registration id associated with this contract
  uint16 registrationID;
  /// the long-term public identity key associated with this contract
  bytes32 public identityKey;
  /// the medium-term public signed public prekey associated with this contract
  bytes32 public signedPreKey;
  /// the signature of the signed public prekey associated with this contract
  bytes32[2] signedPreKeySig;
  /// the array of one-time prekeys associated with this contract
  bytes32[] oneTimePreKeys;
  /// the index of the next one-time prekey to issue
  uint otpkIndex;
  /// the mapping of friendly user contracts associated with this contract
  mapping (address => bool) friends;

  // constructor
  /// initializes a user contract
  /// @param _username the username for this contract
  /// @param _registrationID the registration id for this contract
  /// @param _identityKey the long-term public identity key for this contract
  /// @param _signedPreKey the medium-term signed public prekey for this contract
  /// @param _signedPreKeySig the signature of the public prekey (signed with the identity key)
  /// @param _oneTimePreKeys an array of one-time prekeys
  function CapChatUser(
    bytes32 _username,
    uint16 _registrationID,
    bytes32 _identityKey,
    bytes32 _signedPreKey,
    bytes32[2] _signedPreKeySig,
    bytes32[] _oneTimePreKeys
  ) {
    owner = msg.sender;
    username = _username;
    registrationID = _registrationID;
    identityKey = _identityKey;
    signedPreKey = _signedPreKey;
    signedPreKeySig = _signedPreKeySig;
    oneTimePreKeys = _oneTimePreKeys;
  }

  // events
  // event RegistrationFailed();
  // event RegistrationPassed();
  event FriendAdded(address friend);
  event FriendRemoved(address friend);
  event OneTimePreKey(bytes32 otpk);
  event OneTimePreKeysDepleted();
  event OneTimePreKeysLow(uint count);
  event OneTimePreKeysUpdated(uint count);
  event SignedPreKeyUpdated();
  event Unauthorized(address from, string action);
  event Print(address caddr);

  // functions
  /// returns this contract's the signed public prekey signature
  /// @return { "sig": "the signed public prekey signature" }
  function getSignedPreKeySig() constant returns (bytes32[2] sig) {
    return signedPreKeySig;
  }

  /// updates this contract's medium-term signed public prekey
  /// @param _signedPreKey the new medium-term signed public prekey
  /// @param _signedPreKeySig the signature of the new public prekey (signed with the identity key)
  function updateSignedPreKey(
    bytes32 _signedPreKey,
    bytes32[2] _signedPreKeySig
  ) {
    // only let this contract's owner add keys
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'updateSignedPreKey');
      return;
    }
    signedPreKey = _signedPreKey;
    signedPreKeySig = _signedPreKeySig;
    SignedPreKeyUpdated();
  }

  /// adds the given user contract address to this contract's `friends` mapping
  /// @param caddr the user contract address of the friend to be added
  function addFriend(address caddr) {
    // only let this contract's owner add friends
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'addFriend');
      return;
    }
    friends[caddr] = true;
    FriendAdded(caddr);
  }

  /// removes the given user contract address to this contract's `friends` mapping
  /// @param caddr the user contract address of the friend to be removed
  function removeFriend(address caddr) {
    // only let this contract's owner remove friends
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'removeFriend');
      return;
    }
    delete friends[caddr];
    FriendRemoved(caddr);
  }

  /// issues a single one-time prekey from this contract's `oneTimePreKeys` array
  function getOneTimePreKey() {
    // only let this contract's friends to get a key
    if (!friends[msg.sender]) {
      Unauthorized(msg.sender, 'getOneTimePreKey');
      return;
    }
    // no more keys
    if (otpkIndex >= oneTimePreKeys.length) {
      OneTimePreKeysDepleted();
      return;
    }
    // issue the key
    OneTimePreKey(oneTimePreKeys[otpkIndex++]);
    // check if more keys are needed
    uint remaining = oneTimePreKeys.length - otpkIndex;
    if (remaining < 3)
      OneTimePreKeysLow(remaining);
  }

  /// adds an array of new one-time prekeys to this contract's `oneTimePreKeys` array
  /// @param _oneTimePreKeys the array of new one-time prekeys
  function addOneTimePreKeys(bytes32[] _oneTimePreKeys) {
    // only let this contract's owner add keys
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'addOneTimePreKeys');
      return;
    }
    // move remaining keys to the front of oneTimePreKeys
    if (otpkIndex != 0) {
      uint newLength = 0;
      for (otpkIndex; otpkIndex < oneTimePreKeys.length; otpkIndex++)
        oneTimePreKeys[newLength++] = oneTimePreKeys[otpkIndex];
      oneTimePreKeys.length = newLength;
    }
    // push new keys
    for (uint i = 0; i < _oneTimePreKeys.length; i++)
      oneTimePreKeys.push(_oneTimePreKeys[i]);
    // reset index to 0
    otpkIndex = 0;
    // emit event
    OneTimePreKeysUpdated(oneTimePreKeys.length);
  }

  /// checks the validity of this contract
  /// @dev a contract is valid when the fields set in the contractor are no longer the initial values (i.e. `0x0`).
  /// @dev  additionally, `oneTimePreKeys` must contain at least three keys.
  /// @return { "valid": "whether or not this contract is valid" }
  function isValid() constant returns (bool valid) {
    // set most checks
    valid =
      // owner cannot be zero address
      owner != address(0x0)
      // username cannot be empty string
      && username != bytes32('')
      // registrationID cannot be zero
      && registrationID != 0
      // public keys and signature cannot be zero
      && identityKey != bytes32(0)
      && signedPreKey != bytes32(0)
      && signedPreKeySig[0] != bytes32(0)
      && signedPreKeySig[1] != bytes32(0)
      // oneTimePreKeys must have at least 3 keys
      && oneTimePreKeys.length > 2;
    // ensure none of the keys in oneTimePreKeys is zero
    for (uint i = 0; i < oneTimePreKeys.length; i++)
      valid = valid && oneTimePreKeys[i] != bytes32(0);
  }

  /// registers this user contract with the registry
  /// @return { "status": "whether or not this contract was registered" }
  function register() returns (bool status) {
    // only let this contract's owner register
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'register');
      return false;
    }
    // only let valid contracts be registered
    if (!isValid()) return false;
    // get the address of the current logic contract
    address logic = CapChatRegistry(registry).logicContract();
    // register via the current logic contract
    return Logic(logic).registerUser(username, this);
  }

  /// finds the the associated user contract address for the given username
  /// @param username the username
  /// @return { "caddr": "the associated user contract address" }
  function find(bytes32 username) constant returns (address caddr) {
    // only let this contract's owner find
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'find');
      return;
    }
    // get the address of the current logic contract
    address logic = CapChatRegistry(registry).logicContract();
    // get user contract address via the current logic contract
    return Logic(logic).getUser(username);
  }

  /// deregisters this user contract with the registry
  /// @return { "status": "whether or not this contract was registered" }
  function deregister() returns (bool status) {
    // only let this contract's owner deregister
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'deregister');
      return false;
    }
    // get the address of the current logic contract
    address logic = CapChatRegistry(registry).logicContract();
    // deregister via the current logic contract
    return Logic(logic).deregisterUser(username);
  }
}
