pragma solidity ^0.4.8;

contract CapChatLogic {
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
