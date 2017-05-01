pragma solidity ^0.4.8;

/// @title CapChatRegistry
/// @author thekelvinliu <kelvin@thekelvinliu.com>
contract CapChatLogic {
  // variables
  /// address of the deployed registry contract
  address registry = 0x0;
  /// the owner of this logic contract
  address owner;
  /// the semantic version number of this contract
  uint8[3] version;

  // constructor
  function CapChatLogic() {
    owner = msg.sender;
  }

  // events

  // functions
  function registerUser(bytes32 username, address caddr) {

  }

  function deregisterUser(bytes32 username) {

  }
}
//   // variables
//   // semantic versioning
//   uint[3] version;

//   // events
//   event Registration(string un, address caddr);
//   event RegistrationFailed(string un, address caddr);
//   event RegistrationPassed(string un, address caddr);
//   event Unregistered(string un, address caddr);

//   // modifiers
//   modifier notRegistered(string un) { if (!isRegistered(un)) _; }

//   // private functions
//   // returns true if the given username is valid otherwise false
//   function validUsername(string un) notRegistered(un) returns (bool) {
//     return bytes(un).length > 0;
//   }

//   // public functions
//   // returns true if the given username is registered otherwise false
//   function isRegistered(string un) returns (bool) {
//     return users[un] != address(0x0);
//   }
//   // registers the given username and address and returns status
//   function register(string un, address caddr) returns (bool status) {
//     Registration(un, caddr);
//     // TODO: add some sort of validation
//     // CapChatUser user = CapChatUser(msg.sender);
//     // user.isValid()???
//     if (!validUsername(un) || caddr == address(0x0)) {
//       RegistrationFailed(un, caddr);
//       status = false;
//     } else {
//       RegistrationPassed(un, caddr);
//       users[un] = caddr;
//       status = true;
//     }
//   }
//   // unregisters the given username and returns status
//   // TODO: CHECK THIS
//   function unregister(string un, address caddr) returns (bool) {
//     if (users[un] != msg.sender) return false;
//     users[un] = address(0x0);
//     Unregistered(un, msg.sender);
//     return true;
//   }
// }
