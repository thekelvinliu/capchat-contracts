# capchat-contracts
ethereum smart contracts for capchat

## more
developed and deployed with [truffle](http://truffleframework.com/).
see the [doxity](https://github.com/DigixGlobal/doxity)-generated documentation [here](https://thekelvinliu.github.io/capchat-contracts/).

## todo

### `CapChatLogic`
- [x] hard code deployed registry address
- [x] versioning
- [x] register a username with an address
- [x] get the address of a given username
- [x] deregister a given username
- [ ] write integration tests
- [ ] add events

### `CapChatRegistry`
- [x] write unit tests
- [x] add events
- [x] only allow current backend logic contract to read/write the user mapping
- [x] deploy locally
- [ ] deploy on testnet

### `CapChatUser`
- [x] hard code deployed registry address
- [x] update unit tests
- [ ] write integration tests

## about
capchat is my computer science capstone/senior project.
it is meant to be a secure and usable messaging platform.
this repository contains the ethereum smart contracts for capchat.

kelvin liu, nyu shanghai class of 2017.
