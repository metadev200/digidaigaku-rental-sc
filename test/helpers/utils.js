// based from synthetix repo ./test/utils/index.js
const hre = require("hardhat");

module.exports = provider => {
  async function send(method, payload = null) {
    if (payload) {
      return await provider.send(method, payload);
    } else {
      return await provider.send(method);
    }
  }

  async function mineBlock() {
    send("evm_mine");
  }

  async function takeSnapshot() {
    const result = await send("evm_snapshot");
    await mineBlock();

    return result;
  }

  async function restoreSnapshot(id) {
    await send("evm_revert", [id]);
    await mineBlock();
  }

  async function currentTime() {
    const { timestamp } = await provider.getBlock("latest");
    return timestamp;
  }

  async function fastForwardTo(timestamp) {
    await send("evm_setNextBlockTimestamp", [timestamp]);
    await mineBlock();
  }

  async function fastForward(seconds) {
    await send("evm_increaseTime", [seconds]);
    await mineBlock();
  }

  return {
    send,
    mineBlock,
    takeSnapshot,
    restoreSnapshot,
    currentTime,
    fastForwardTo,
    fastForward,
  };
};
