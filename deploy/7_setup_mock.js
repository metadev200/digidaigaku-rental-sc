const verify = require('../helpers/verify')
const { networkConfig, developmentChains } = require('../helpers/hardhat-config')
const { ethers } = require('hardhat')
const { hexStripZeros } = require('ethers/lib/utils')

const deployGenesis = async function (hre) {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    log('----------------------------------------------------')
    log('Deploying DigiDaigaku Genesis and waiting for confirmations...')

    const DigiDaigaku = await get('DigiDaigaku')
    const genesis = await ethers.getContractAt(DigiDaigaku.abi, DigiDaigaku.address)

    const DigiDaigakuSpirits = await get('DigiDaigakuSpirits')
    const spirit = await ethers.getContractAt(DigiDaigakuSpirits.abi, DigiDaigakuSpirits.address)

    const DigiDaigakuHeroes = await get('DigiDaigakuHeroes')
    const heroes = await ethers.getContractAt(DigiDaigakuHeroes.abi, DigiDaigakuHeroes.address)

    const HeroAdventure = await get('HeroAdventure')
    const adventure = await ethers.getContractAt(HeroAdventure.abi, HeroAdventure.address)

    log(`-------------- setting Genesis Metadata -------------`)

    const genesisBaseMetadataUrl = "https://digidaigaku.com/metadata/"
    const genesisTx = await genesis.setBaseURI(genesisBaseMetadataUrl)
    await genesisTx.wait(process.env.WAIT_CONFIRMATION || 3)

    log(`-------------- setting Spirit Metadata -------------`)

    const spiritBaseMetadataUrl = "https://digidaigaku.com/spirits/metadata/"
    const spiritTx = await spirit.setBaseURI(spiritBaseMetadataUrl)
    await spiritTx.wait(process.env.WAIT_CONFIRMATION || 3)

    log(`-------------- setting Heroes Metadata -------------`)

    const heroesBaseMetadataUrl = "https://digidaigaku.com/heroes/metadata/"
    const heroesTx = await heroes.setBaseURI(heroesBaseMetadataUrl)
    await heroesTx.wait(process.env.WAIT_CONFIRMATION || 3)

    log(`-------------- Whitelist Adventure to Hero  -------------`)

    const isMinterWhitelisted = await heroes.isMinterWhitelisted(HeroAdventure.address)
    if (!isMinterWhitelisted) {
        // exist in mainnet
        const whitelistMinterTx = await heroes.whitelistMinter(HeroAdventure.address)
        await whitelistMinterTx.wait(process.env.WAIT_CONFIRMATION || 3)
    } else {
        log(`minter already whitelisted`)
    }

    log(`-------------- Whitelist Adventure to Spirit  -------------`)

    const isAdventureWhitelisted = await spirit.isAdventureWhitelisted(HeroAdventure.address)
    if (!isAdventureWhitelisted) {
        // exist in mainnet
        const whitelistAdventureTx = await spirit.whitelistAdventure(HeroAdventure.address, true)
        await whitelistAdventureTx.wait(process.env.WAIT_CONFIRMATION || 3)
    } else {
        log(`hero adventure already whitelisted`)
    }

    log(`-------------- Minting Genesis to ${deployer}  -------------`)

    // mint genesis
    const mintGenesisTx = await genesis.mintFromOwner(5, deployer)
    await mintGenesisTx.wait(process.env.WAIT_CONFIRMATION || 3)

    log(`-------------- Minting Spirit to ${deployer}  -------------`)

    // mint genesis
    const mintSpiritTx = await spirit.airdropMint([deployer, deployer, deployer])
    await mintSpiritTx.wait(process.env.WAIT_CONFIRMATION || 3)
}

module.exports = deployGenesis
deployGenesis.tags = ['mock-data']
