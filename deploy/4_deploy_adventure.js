const verify = require('../helpers/verify')
const { networkConfig, developmentChains } = require('../helpers/hardhat-config')

const deployToken = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    log('----------------------------------------------------')
    log('Deploying HeroAdventure and waiting for confirmations...')

    const genesisToken = await get('DigiDaigaku')
    const heroToken = await get('DigiDaigakuHeroes')
    const spiritToken = await get('DigiDaigakuSpirits')

    const token = await deploy('HeroAdventure', {
        from: deployer,
        args: [heroToken.address, genesisToken.address, spiritToken.address],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(token.address, [heroToken.address, genesisToken.address, spiritToken.address])
    }
}

module.exports = deployToken
deployToken.tags = ['mock']
