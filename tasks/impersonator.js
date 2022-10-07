const { task } = require("hardhat/config");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

task("setup", "Setup chain")
  .setAction(async (_, hre) => {
    const accounts = await hre.ethers.getSigners();
    const { getNamedAccounts, deployments } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts();

    await accounts[0].sendTransaction({
      to: process.env.MAINNET_GENESIS_OWNER1,
      value: hre.ethers.utils.parseEther('10')
    });

    await accounts[1].sendTransaction({
      to: process.env.MAINNET_SPIRIT_OWNER1,
      value: hre.ethers.utils.parseEther('10')
    });

    // Deploy BreederDigiRenter with digi mainnet contracts - applicable for local mainnet fork
    // Comment out when mainnet instance is deployed
    let digiRenter = await deploy('BreederDigiRenter', {
      from: deployer,
      args: [
        process.env.MAINNET_GENESIS_CONTRACT,
        process.env.MAINNET_HEROES_CONTRACT,
        process.env.MAINNET_SPIRIT_CONTRACT,
        process.env.MAINNET_ADVENTURE_CONTRACT,
      ],
      log: true,
    });

    console.log('BreederDigiRenter: ', digiRenter.address);
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
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    await digiRenter.withdrawGenesis(Number(_.genesisId));
  });


task("update-genesis-fee", "Update the deposited Genesis fee")
  .addParam("genesisId", "Genesis Token Id")
  .addParam("newFee", "Renting new fee")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.MAINNET_GENESIS_OWNER1);

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    await digiRenter.updateGenesisFee(Number(_.genesisId), Number(_.newFee));

    // console.log(await digiRenter.genesisFee(_.genesisId));
  });

task("enter-hero-quest", "Enter Hero Quest")
  .addParam("genesisId", "Genesis Token Id")
  .addParam("spiritId", "Spirit Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);

    const spiritToken = await ethers.getContractAt(
      'DigiDaigakuSpirits',
      process.env.MAINNET_SPIRIT_CONTRACT,
      spiritOwner,
    );

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      spiritOwner,
    );

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
    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      spiritOwner,
    );

    await hre.network.provider.send('evm_increaseTime', [90000]); // fast forward 25 hours
    await hre.network.provider.send('evm_mine');

    await digiRenter.mintHero(Number(_.spiritId));
  });

task("force-claim", "Force claim")
  .addParam("genesisId", "Genesis Token Id")
  .setAction(async (_, { ethers }) => {
    // Impersonate account
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    await hre.network.provider.send('evm_increaseTime', [180000]); // fast forward 50 hours
    await hre.network.provider.send('evm_mine');

    await digiRenter.forceClaim(Number(_.genesisId));
  });

task('test-happy-path', 'Check genesis')
  .addParam('genesisId', 'Genesis token id')
  .addParam('spiritId', 'Spirit token id')
  .addParam('fee', 'Genesis rent fee')
  .setAction(async (_, { ethers }) => {
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);

    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);

    const genesisToken = await ethers.getContractAt(
      'DigiDaigaku',
      process.env.MAINNET_GENESIS_CONTRACT,
      genesisOwner,
    );

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    const spiritToken = await ethers.getContractAt(
      'DigiDaigakuSpirits',
      process.env.MAINNET_SPIRIT_CONTRACT,
      spiritOwner,
    );

    const adventureToken = await ethers.getContractAt(
      'HeroAdventure',
      process.env.MAINNET_ADVENTURE_CONTRACT,
    );

    const heroToken = await ethers.getContractAt(
      'DigiDaigakuHeroes',
      process.env.MAINNET_HEROES_CONTRACT,
    );

    // Approve DigiRenter with Genesis
    await genesisToken.approve(digiRenter.address, Number(_.genesisId));

    // Deposit Genesis
    await digiRenter.depositGenesis(Number(_.genesisId), Number(_.fee))
    console.log('SUCCESSFULLY DEPOSITED GENESIS...')

    // Approve DigiRenter with Spirits
    await spiritToken.approve(digiRenter.address, Number(_.spiritId));

    // Enter Hero Quest
    await digiRenter.connect(spiritOwner).enterHeroQuest(Number(_.spiritId), Number(_.genesisId), {
      value: Number(_.fee),
    });
    console.log('SUCCESSFULLY ENTERED A HERO QUEST...');

    // Check Post-Enter-Hero-Quest State
    let genesisQuest = await adventureToken.genesisQuestLookup(Number(_.genesisId))
    if(genesisQuest.genesisTokenId == Number(_.genesisId)) console.log('Correct genesis id on quest...')
    else console.log('Incorrect genesis token on quest...')

    if(genesisQuest.spiritTokenId == Number(_.spiritId)) console.log('Correct spirit id on quest...');
    else console.log('Incorrect spirit token on quest...');

    if(genesisQuest.adventurer.toLowerCase() == digiRenter.address.toLowerCase()) console.log('Correct adventurer on quest...');
    else console.log('Incorrect adventurer on quest...');

    await hre.network.provider.send('evm_increaseTime', [90000]); // fast forward 25 hours
    await hre.network.provider.send('evm_mine');

    await digiRenter.connect(spiritOwner).mintHero(Number(_.spiritId));
    console.log('SUCCESSFULLY MINTED A HERO...')

    // Check Post-Mint-Hero State
    if((await heroToken.ownerOf(Number(_.spiritId))).toLowerCase() == spiritOwner.address.toLowerCase()) console.log('Correct hero token owner... ');
    else console.log('Incorrect hero token owner... ');
  });

task('test-force-claim', 'Test Force claiming')
  .addParam('genesisId', 'Genesis token id')
  .addParam('spiritId', 'Spirit token id')
  .addParam('fee', 'Genesis rent fee')
  .setAction(async (_, { ethers }) => {
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);

    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);

    const genesisToken = await ethers.getContractAt(
      'DigiDaigaku',
      process.env.MAINNET_GENESIS_CONTRACT,
      genesisOwner,
    );

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    const spiritToken = await ethers.getContractAt(
      'DigiDaigakuSpirits',
      process.env.MAINNET_SPIRIT_CONTRACT,
      spiritOwner,
    );

    const adventureToken = await ethers.getContractAt(
      'HeroAdventure',
      process.env.MAINNET_ADVENTURE_CONTRACT,
    );

    const heroToken = await ethers.getContractAt(
      'DigiDaigakuHeroes',
      process.env.MAINNET_HEROES_CONTRACT,
    );

    // Approve DigiRenter with Genesis
    await genesisToken.approve(digiRenter.address, Number(_.genesisId));

    // Deposit Genesis
    await digiRenter.depositGenesis(Number(_.genesisId), Number(_.fee))
    console.log('SUCCESSFULLY DEPOSITED GENESIS...')

    // Approve DigiRenter with Spirits
    await spiritToken.approve(digiRenter.address, Number(_.spiritId));

    // Enter Hero Quest
    await digiRenter.connect(spiritOwner).enterHeroQuest(Number(_.spiritId), Number(_.genesisId), {
      value: Number(_.fee),
    });
    console.log('SUCCESSFULLY ENTERED A HERO QUEST...');

    // Check Post-Enter-Hero-Quest State
    let genesisQuest = await adventureToken.genesisQuestLookup(Number(_.genesisId))
    if(genesisQuest.genesisTokenId == Number(_.genesisId)) console.log('Correct genesis id on quest...')
    else console.log('Incorrect genesis token on quest...')

    if(genesisQuest.spiritTokenId == Number(_.spiritId)) console.log('Correct spirit id on quest...');
    else console.log('Incorrect spirit token on quest...');

    if(genesisQuest.adventurer.toLowerCase() == digiRenter.address.toLowerCase()) console.log('Correct adventurer on quest...');
    else console.log('Incorrect adventurer on quest...');

    await hre.network.provider.send('evm_increaseTime', [180000]); // fast forward 50 hours
    await hre.network.provider.send('evm_mine');

    await digiRenter.forceClaim(Number(_.genesisId));
    console.log('SUCCESSFULLY MINTED A HERO...')

    // Check Post-Mint-Hero State
    if((await heroToken.ownerOf(Number(_.spiritId))).toLowerCase() == spiritOwner.address.toLowerCase()) console.log('Correct hero token owner... ');
    else console.log('Incorrect hero token owner... ');
  });

task('test-invalid-mint', 'Test Invalid Mint')
  .addParam('genesisId', 'Genesis token id')
  .addParam('spiritId', 'Spirit token id')
  .addParam('fee', 'Genesis rent fee')
  .setAction(async (_, { ethers }) => {
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);

    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);

    const genesisToken = await ethers.getContractAt(
      'DigiDaigaku',
      process.env.MAINNET_GENESIS_CONTRACT,
      genesisOwner,
    );

    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );

    const spiritToken = await ethers.getContractAt(
      'DigiDaigakuSpirits',
      process.env.MAINNET_SPIRIT_CONTRACT,
      spiritOwner,
    );

    const adventureToken = await ethers.getContractAt(
      'HeroAdventure',
      process.env.MAINNET_ADVENTURE_CONTRACT,
    );

    // Approve DigiRenter with Genesis
    await genesisToken.approve(digiRenter.address, Number(_.genesisId));

    // Deposit Genesis
    await digiRenter.depositGenesis(Number(_.genesisId), Number(_.fee))
    console.log('SUCCESSFULLY DEPOSITED GENESIS...')

    // Approve DigiRenter with Spirits
    await spiritToken.approve(digiRenter.address, Number(_.spiritId));

    // Enter Hero Quest
    await digiRenter.connect(spiritOwner).enterHeroQuest(Number(_.spiritId), Number(_.genesisId), {
      value: Number(_.fee),
    });
    console.log('SUCCESSFULLY ENTERED A HERO QUEST...');

    // Check Post-Enter-Hero-Quest State
    let genesisQuest = await adventureToken.genesisQuestLookup(Number(_.genesisId))
    if(genesisQuest.genesisTokenId == Number(_.genesisId)) console.log('Correct genesis id on quest...')
    else console.log('Incorrect genesis token on quest...')

    if(genesisQuest.spiritTokenId == Number(_.spiritId)) console.log('Correct spirit id on quest...');
    else console.log('Incorrect spirit token on quest...');

    if(genesisQuest.adventurer.toLowerCase() == digiRenter.address.toLowerCase()) console.log('Correct adventurer on quest...');
    else console.log('Incorrect adventurer on quest...');

    await hre.network.provider.send('evm_increaseTime', [90000]); // fast forward 25 hours
    await hre.network.provider.send('evm_mine');

    try {
      await digiRenter.connect(genesisOwner).mintHero(Number(_.spiritId));
    } catch (error) {
      if(error.reason.includes('BreederDigiRenter.onlySpiritOwner: not owner of spirit'))
        console.log('SUCCESSFULLY PREVENTED INVALID MINT...')
    }
  });

task('test-invalid-force-claim', 'Test Invalid Force Claim')
  .addParam('genesisId', 'Genesis token id')
  .addParam('spiritId', 'Spirit token id')
  .addParam('fee', 'Genesis rent fee')
  .setAction(async (_, { ethers }) => {
    await helpers.impersonateAccount(process.env.MAINNET_GENESIS_OWNER1);
    const genesisOwner = await ethers.getSigner(process.env.MAINNET_GENESIS_OWNER1);
  
    await helpers.impersonateAccount(process.env.MAINNET_SPIRIT_OWNER1);
    const spiritOwner = await ethers.getSigner(process.env.MAINNET_SPIRIT_OWNER1);
  
    const genesisToken = await ethers.getContractAt(
      'DigiDaigaku',
      process.env.MAINNET_GENESIS_CONTRACT,
      genesisOwner,
    );
  
    const digiRenter = await ethers.getContractAt(
      'BreederDigiRenter',
      process.env.MAINNET_DIGIRENTER_CONTRACT,
      genesisOwner,
    );
  
    const spiritToken = await ethers.getContractAt(
      'DigiDaigakuSpirits',
      process.env.MAINNET_SPIRIT_CONTRACT,
      spiritOwner,
    );
  
    const adventureToken = await ethers.getContractAt(
      'HeroAdventure',
      process.env.MAINNET_ADVENTURE_CONTRACT,
    );
  
    // Approve DigiRenter with Genesis
    await genesisToken.approve(digiRenter.address, Number(_.genesisId));
  
    // Deposit Genesis
    await digiRenter.depositGenesis(Number(_.genesisId), Number(_.fee))
    console.log('SUCCESSFULLY DEPOSITED GENESIS...')
  
    // Approve DigiRenter with Spirits
    await spiritToken.approve(digiRenter.address, Number(_.spiritId));
  
    // Enter Hero Quest
    await digiRenter.connect(spiritOwner).enterHeroQuest(Number(_.spiritId), Number(_.genesisId), {
      value: Number(_.fee),
    });
    console.log('SUCCESSFULLY ENTERED A HERO QUEST...');
  
    // Check Post-Enter-Hero-Quest State
    let genesisQuest = await adventureToken.genesisQuestLookup(Number(_.genesisId))
    if(genesisQuest.genesisTokenId == Number(_.genesisId)) console.log('Correct genesis id on quest...')
    else console.log('Incorrect genesis token on quest...')
  
    if(genesisQuest.spiritTokenId == Number(_.spiritId)) console.log('Correct spirit id on quest...');
    else console.log('Incorrect spirit token on quest...');
  
    if(genesisQuest.adventurer.toLowerCase() == digiRenter.address.toLowerCase()) console.log('Correct adventurer on quest...');
    else console.log('Incorrect adventurer on quest...');
  
    await hre.network.provider.send('evm_increaseTime', [180000]); // fast forward 50 hours
    await hre.network.provider.send('evm_mine');
  
    try {
      await digiRenter.connect(spiritOwner).forceClaim(Number(_.genesisId));
    } catch (error) {
      if(error.reason.includes('BreederDigiRenter.forceClaim: not owner of genesis'))
        console.log('SUCCESSFULLY PREVENTED INVALID CLAIM...')
    }
  });
