const { task } = require("hardhat/config");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

task("setup", "Setup chain")
  .setAction(async (_, { ethers }) => {
    const accounts = await ethers.getSigners();

    await accounts[0].sendTransaction({
      to: process.env.GENESIS_OWNER,
      value: ethers.utils.parseEther('10')
    });

    await accounts[1].sendTransaction({
      to: process.env.SPIRIT_OWNER,
      value: ethers.utils.parseEther('10')
    });
  });

task("deposit-genesis", "Deposit Genesis token")
  .addParam("genesisId", "Genesis Token Id") // had to pass as --genesis-id
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.GENESIS_OWNER);
    const genesisOwner = await ethers.getSigner(process.env.GENESIS_OWNER);
    
    const genesisToken = await ethers.getContract('DigiDaigaku', genesisOwner);
    const digiRenter = await ethers.getContract('BreederDigiRenter', genesisOwner);

    // Approve DigiRenter
    await genesisToken.approve(digiRenter.address, Number(_.genesisId));

    // Deposit Genesis
    await digiRenter.depositGenesis(Number(_.genesisId), 10000000);
  });

task("withdraw-genesis", "Withdraw Genesis token")
  .addParam("genesisId", "Genesis Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.GENESIS_OWNER);
    const genesisOwner = await ethers.getSigner(process.env.GENESIS_OWNER);

    const digiRenter = await ethers.getContract('BreederDigiRenter', genesisOwner);

    await digiRenter.withdrawGenesis(Number(_.genesisId));
  });


task("update-genesis-fee", "Update the deposited Genesis fee")
  .addParam("genesisId", "Genesis Token Id")
  .addParam("newFee", "Renting new fee")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.GENESIS_OWNER);
    const genesisOwner = await ethers.getSigner(process.env.GENESIS_OWNER);

    const digiRenter = await ethers.getContract('BreederDigiRenter', genesisOwner);

    await digiRenter.updateGenesisFee(Number(_.genesisId), Number(_.newFee));

    // console.log(await digiRenter.genesisFee(_.genesisId));
  });

task("enter-hero-quest", "Enter Hero Quest")
  .addParam("genesisId", "Genesis Token Id")
  .addParam("spiritId", "Spirit Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.SPIRIT_OWNER);
    const spiritOwner = await ethers.getSigner(process.env.SPIRIT_OWNER);

    const spiritToken = await ethers.getContract('DigiDaigakuSpirits', spiritOwner);
    const digiRenter = await ethers.getContract('BreederDigiRenter', spiritOwner);

    // Approve DigiRenter with Spirits
    await spiritToken.approve(digiRenter.address, Number(_.spiritId));

    const genesisFee = await digiRenter.genesisFee(Number(_.genesisId));
    
    await digiRenter.enterHeroQuest(Number(_.spiritId), Number(_.genesisId), {
      value: Number(genesisFee),
    });

    // console.log(await digiRenter.genesisIsOnAdventure(_.genesisId))
  });

task("mint-hero", "Mint Hero")
  .addParam("spiritId", "Spirit Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.SPIRIT_OWNER);
    const spiritOwner = await ethers.getSigner(process.env.SPIRIT_OWNER);

    const digiRenter = await ethers.getContract('BreederDigiRenter', spiritOwner);

    await digiRenter.mintHero(Number(_.spiritId));
  });

task("force-claim", "Force claim")
  .addParam("genesisId", "Genesis Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.GENESIS_OWNER);
    const genesisOwner = await ethers.getSigner(process.env.GENESIS_OWNER);

    const digiRenter = await ethers.getContract('BreederDigiRenter', genesisOwner);

    await digiRenter.forceClaim(Number(_.genesisId));
  });

