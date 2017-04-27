pragma solidity ^0.4.8;

contract CapChatRegistry {
  // variables
  // address of current backend logic contract
  address public currBackend;
  // addresses of previous logic contracts
  address[] prevBackends;
  // maps username to user contract address
  mapping (string => address) users;
  // owner of this registry
  address owner;

  // constructor
  // initialize this registry with the originating address
  function CapChatRegistry() {
    owner = tx.origin;
  }

  // modifiers
  modifier onlyCurrent() { if (msg.sender == currBackend) _; }
  modifier onlyOwner() { if (msg.sender == owner) _; }

  // functions
  // changes the current backend logic contract to the given address
  function changeBackend(address newBackend) onlyOwner returns (bool) {
    // don't do anything if the given address is the same
    if (newBackend == currBackend) return false;
    prevBackends.push(currBackend);
    currBackend = newBackend;
    return true;
  }
  // returns true if the given user is in the mapping, otherwise false
  function isRegistered(string user) constant returns (bool) {
    return users[user] != address(0x0);
  }
  // adds the given user and contract address to the registry
  function addUser(string user, address caddr) onlyCurrent returns (bool) {
    // fail if the user is not already registered
    if (!isRegistered(user)) return false;
    users[user] = caddr;
    return true;
  }
  // returns the contract address for the given user
  function getUser(string user) onlyCurrent constant returns (address) {
    return users[user];
  }
  // removes the given user from the registry
  function removeUser(string user) onlyCurrent {
    delete users[user];
  }
}
