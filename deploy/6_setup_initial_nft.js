const { ethers } = require("hardhat");
require('dotenv').config()

MINT_QUANTITY = process.env.MINT_QUANTITY
GENESIS_OWNER = process.env.GENESIS_OWNER
SPIRIT_OWNER = process.env.SPIRIT_OWNER

const setupInitialNFT = async function (hre) {
    const { getNamedAccounts, deployments } = hre
    const { log } = deployments
    const { deployer } = await getNamedAccounts()

    log('----------------------------------------------------')
    log('Setting up initial NFT for genesis and spirit...')

    const spiritToken = await ethers.getContract(
        "DigiDaigakuSpirits",
        deployer
    );
    const genesisToken = await ethers.getContract(
        "DigiDaigaku",
        deployer
    );

    log('----------------------------------------------------')
    log('Minting 20 genesis tokens to genesis owner...')
    await (await genesisToken.mintFromOwner(MINT_QUANTITY, GENESIS_OWNER)).wait()

    log('----------------------------------------------------')
    log('Minting 20 spirit tokens to spirit owner...')
    // minting spirits
    const SPIRIT_OWNERS = Array.from({length: MINT_QUANTITY}).fill(SPIRIT_OWNER)
    await (await spiritToken.airdropMint(SPIRIT_OWNERS)).wait()
}

module.exports = setupInitialNFT
setupInitialNFT.tags = ['mock', 'setup']
