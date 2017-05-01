pragma solidity ^0.4.8;

import './CapChatRegistry.sol';
import './Logic.sol';

/// @title CapChatLogic
/// @author thekelvinliu <kelvin@thekelvinliu.com>
contract CapChatLogic is Logic {
  // variables
  /// address of the deployed registry contract
  address constant registry = 0xfbbbf7b0f4bd8c57e518532f9273dd8d085da5ce;
  /// the owner of this logic contract
  address owner;
  /// the semantic version number of this contract
  uint8[3] version;

  // constructor
  /// initializes a logic contract
  /// @param major the major version of this contract
  /// @param minor the minor version of this contract
  /// @param patch the patch version of this contract
  function CapChatLogic(uint8 major, uint8 minor, uint8 patch) {
    owner = msg.sender;
    version[0] = major;
    version[1] = minor;
    version[2] = patch;
  }

  // functions
  /// adds the given username and user contract to the registry contract
  /// @param username the username
  /// @param caddr the user contract
  /// @return { "status": "true if the add was successful, otherwise false" }
  function registerUser(bytes32 username, address caddr) returns (bool status) {
    return CapChatRegistry(registry).add(username, caddr);
  }

  /// gets the given username from the registry contract
  /// @param username the username
  /// @return { "caddr": "the corresponding user contract address" }
  function getUser(bytes32 username) returns (address caddr) {
    return CapChatRegistry(registry).get(username);
  }

  /// removes the given username from the registry contract
  /// @param username the username
  /// @return { "status": "true if the remove was successful, otherwise false" }
  function deregisterUser(bytes32 username) returns (bool status) {
    return CapChatRegistry(registry).remove(username);
  }
}
