pragma solidity ^0.4.8;

/// @title CapChatRegistry
/// @author thekelvinliu <kelvin@thekelvinliu.com>
contract CapChatRegistry {
  // variables
  /// owner of this registry contract
  address owner;
  /// address of the curent logic contract
  address public logicContract;
  /// the main user registry mapping username to user contract address
  mapping (bytes32 => address) registry;

  // constructor
  /// initializes a registry with the originating address
  function CapChatRegistry() {
    owner = tx.origin;
  }

  // events
  event MappingAdded(bytes32 username, address caddr);
  event MappingRemoved(bytes32 username);
  event NewLogic(address caddr);
  event Unauthorized(address from, string action);

  // functions
  /// adds a mapping from the given username to the given contract address
  /// @param username the username
  /// @param caddr the contract address
  /// @return { "status": "true if the add was successful, otherwise false" }
  function add(bytes32 username, address caddr) returns (bool status) {
    // only allow the current logic contract to add mappings
    if (msg.sender != logicContract) {
      Unauthorized(msg.sender, 'add');
      return false;
    }
    // fail if the username already has a mapping
    if (registry[username] != address(0x0)) return false;
    registry[username] = caddr;
    MappingAdded(username, caddr);
    return true;
  }

  /// gets the corresponding contract address for the given username
  /// @param username the username
  /// @return { "caddr": "the corresponding user contract address" }
  function get(bytes32 username) constant returns (address caddr) {
    // only allow the current logic contract to get mappings
    return (msg.sender != logicContract) ? address(0x0) : registry[username];
  }

  /// removes the mapping for the given username
  /// @param username the username
  /// @return { "status": "true if the remove was successful, otherwise false" }
  function remove(bytes32 username) returns (bool status) {
    // only allow the current logic contract to remove mappings
    if (msg.sender != logicContract) {
      Unauthorized(msg.sender, 'remove');
      return false;
    }
    // fail if the username does not have a mapping
    if (registry[username] == address(0x0)) return false;
    delete registry[username];
    MappingRemoved(username);
    return true;
  }

  /// updates the current logic contract to the given address
  /// @param newLogic the deployed address of a new logic contract
  /// @return { "status": "true if the update was successful, otherwise false" }
  function updateLogic(address newLogic) returns (bool status) {
    // only allow the owner of this contract to update the logic contract
    if (msg.sender != owner) {
      Unauthorized(msg.sender, 'updateLogic');
      return false;
    }
    // don't do anything if the given address is already the logic contract
    if (newLogic == logicContract) return false;
    logicContract = newLogic;
    NewLogic(logicContract);
    return true;
  }
}
