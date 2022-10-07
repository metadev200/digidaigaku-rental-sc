const verify = require('../helpers/verify')
const { networkConfig, developmentChains } = require('../helpers/hardhat-config')

const deployToken = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log('----------------------------------------------------')
    log('Deploying DigiDaigaku Genesis and waiting for confirmations...')

    const token = await deploy('DigiDaigaku', {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(token.address, [])
    }
}

module.exports = deployToken
deployToken.tags = ['mock']
