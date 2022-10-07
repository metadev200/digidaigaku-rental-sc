const verify = require('../helpers/verify')
const { ethers } = require("hardhat");
const { networkConfig, developmentChains } = require('../helpers/hardhat-config')

const deployAdventure = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    log('----------------------------------------------------')
    log('Deploying HeroAdventure and waiting for confirmations...')

    const genesisToken = await get('DigiDaigaku')
    const spiritToken = await ethers.getContract(
        "DigiDaigakuSpirits",
        deployer
    );
    const heroToken = await ethers.getContract(
        "DigiDaigakuHeroes",
        deployer
    );

    const heroAdventure = await deploy('HeroAdventure', {
        from: deployer,
        args: [heroToken.address, genesisToken.address, spiritToken.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    log('----------------------------------------------------')
    log('Whitelisting adventure as hero minter & adventure on spirit...')
    await (await heroToken.whitelistMinter(heroAdventure.address)).wait()
    await (await spiritToken.whitelistAdventure(heroAdventure.address, true)).wait()

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(heroAdventure.address, [heroToken.address, genesisToken.address, spiritToken.address])
    }
}

module.exports = deployAdventure
deployAdventure.tags = ['mock']
