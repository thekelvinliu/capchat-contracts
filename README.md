# capchat-contracts
ethereum smart contracts for capchat

## more
developed and deployed with [truffle](http://truffleframework.com/).
see the [doxity](https://github.com/DigixGlobal/doxity)-generated documentation [here](https://thekelvinliu.github.io/capchat-contracts/).

## todo
- [ ] write integration tests
- [ ] document everything

### `CapChatLogic`
- [ ] write unit tests
- [ ] hard code deployed registry address
- [ ] versioning
- [ ] register a username with an address
- [ ] get the address of a given username
- [ ] deregister a given username
- [ ] hard code deployed registry address

### `CapChatRegistry`
- [x] write unit tests
- [x] add events
- [x] only allow current backend logic contract to read/write the user mapping
- [ ] deploy

### `CapChatUser`
- [ ] update unit tests
- [ ] hard code deployed registry address

## about
capchat is my computer science capstone/senior project.
it is meant to be a secure and usable messaging platform.
this repository contains the ethereum smart contracts for capchat.  
kelvin liu, nyu shanghai class of 2017.
