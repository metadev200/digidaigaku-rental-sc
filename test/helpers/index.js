const { expect } = require("chai");

module.exports = {
  async onlyGivenAddressCanInvoke({
    contract,
    fnc,
    args,
    accounts,
    address = undefined,
    skipPassCheck = false,
    reason = undefined,
  }) {
    for (const user of accounts) {
      if (user === address) {
        continue;
      }
      if (reason) {
        await expect(contract.connect(user)[fnc](...args)).to.be.revertedWith(
          reason
        );
      } else {
        await expect(contract.connect(user)[fnc](...args)).to.be.reverted;
      }
    }
    if (!skipPassCheck && address) {
      await contract.connect(address)[fnc](...args);
    }
  },
};
