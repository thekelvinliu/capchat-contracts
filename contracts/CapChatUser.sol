pragma solidity ^0.4.8;

/// @title CapChatUser
/// @author thekelvinliu <kelvin@thekelvinliu.com>
contract CapChatUser {
  // variables
  address owner;
  bytes32 username;
  uint16 registrationID;
  bytes32 public identityKey;
  bytes32 public signedPreKey;
  bytes32[2] signedPreKeySig;
  bytes32[] oneTimePreKeys;
  uint otpkIndex;
  mapping (address => bool) friends;

  // constructor
  /// initializes a user contract
  /// @param _username the username for this contract
  /// @param _registrationID the registrationID for this contract
  /// @param _identityKey the long-term public identity key for this contract
  /// @param _signedPreKey the medium-term signed public prekey for this contract
  /// @param _signedPreKeySig the signature of the public prekey
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

  // functions
  // returns this contract's signedPreKeySig
  function getSignedPreKeySig() constant returns (bytes32[2]) {
    return signedPreKeySig;
  }

  // updates this contract's signedPreKeySig
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

  // adds the given address to the friends mapping
  function addFriend(address friend) {
    // only let this contract's owner add friends
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'addFriend');
      return;
    }
    friends[friend] = true;
    FriendAdded(friend);
  }

  // removes the given address from the friends mapping
  function removeFriend(address friend) {
    // only let this contract's owner remove friends
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'removeFriend');
      return;
    }
    delete friends[friend];
    FriendRemoved(friend);
  }

  // returns a key from oneTimePreKeys via an event
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

  // supplements oneTimePreKeys with more keys
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

  // returns whether or not this contract is in a valid state
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

  // register

  // deregister
}
