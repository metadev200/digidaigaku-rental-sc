const verify = require('../helpers/verify')
const { networkConfig, developmentChains } = require('../helpers/hardhat-config')

const deployToken = async function (hre) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()

  log('----------------------------------------------------')
  log('Deploying token and waiting for confirmations...')

  const genesisToken = await get('DigiDaigaku')
  const heroToken = await get('DigiDaigakuHeroes')
  const spiritToken = await get('DigiDaigakuSpirits')
  const adventure = await get('HeroAdventure')

  const token = await deploy('BreederDigiRenter', {
    from: deployer,
    args: [genesisToken.address, heroToken.address, spiritToken.address, adventure.address],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  })

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(token.address, [genesisToken.address, heroToken.address, spiritToken.address, adventure.address])
  }
}

module.exports = deployToken
deployToken.tags = ['token']
