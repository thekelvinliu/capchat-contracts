const CapChat = artifacts.require("./CapChat.sol");
const CapChatUser = artifacts.require("./CapChatUser.sol");

module.exports = deployer => {
  deployer.deploy(CapChat);
  deployer.link(CapChat, CapChatUser);
};
