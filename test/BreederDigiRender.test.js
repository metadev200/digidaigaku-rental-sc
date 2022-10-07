const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BreederDigiRender", function () {

    // ===== Reference for Mainnet Fork Test =====
    // DigiDaigaku genesisToken =
    //     DigiDaigaku(0xd1258DB6Ac08eB0e625B75b371C023dA478E94A9);
    // DigiDaigakuHeroes heroToken =
    //     DigiDaigakuHeroes(0xA225632b2EBc32B9f4278fc8E3FE5C6f6496D970);
    // DigiDaigakuSpirits spiritToken =
    //     DigiDaigakuSpirits(0xa8824EeE90cA9D2e9906D377D36aE02B1aDe5973);
    // HeroAdventure adventure =
    //     HeroAdventure(0xE60fE8C4C60Fd97f939F5136cCeb7c41EaaA624d);


    let genesisToken, heroToken, spiritToken, adventure;
    let breederDigiRender;

    let owner, addr1, addr2;

    this.beforeEach(async function()  {
        [owner, addr1, addr2] = await ethers.getSigners()
        const GenesisToken = await ethers.getContractFactory("DigiDaigaku")
        genesisToken = await GenesisToken.deploy()

        const DigiDaigakuHeroes = await ethers.getContractFactory("DigiDaigakuHeroes")
        heroToken = await DigiDaigakuHeroes.deploy()

        const DigiDaigakuSpirits = await ethers.getContractFactory("DigiDaigakuSpirits")
        spiritToken = await DigiDaigakuSpirits.deploy()

        const HeroAdventure = await ethers.getContractFactory("HeroAdventure")
        adventure = await HeroAdventure.deploy(heroToken.address, genesisToken.address, spiritToken.address)

        const BreederDigiRenter = await ethers.getContractFactory("BreederDigiRenter")
        breederDigiRender = await BreederDigiRenter.deploy(genesisToken.address, heroToken.address, spiritToken.address, adventure.address)
    })

    describe("Setup", function() {
        it ("Should have the correct GenesisToken address", async function() {
            expect(await breederDigiRender.genesisToken()).to.equal(genesisToken.address)
        })

        it ("Should have the correct DigiDaigakuHeroes address", async function() {
            expect(await breederDigiRender.heroToken()).to.equal(heroToken.address)
        })

        it ("Should have the correct DigiDaigakuSpirits address", async function() {
            expect(await breederDigiRender.spiritToken()).to.equal(spiritToken.address)
        })

        it ("Should have the correct HeroAdventure address", async function() {
            expect(await breederDigiRender.adventure()).to.equal(adventure.address)
        })
    })

    describe("Enter Quest", function() {
        const MINT_QUANTITY = 2

        const GENESIS_ID = 1
        const GENESIS_PRICE_IN_WEI = ethers.utils.parseEther("0.1")

        const SPIRIT_ID = 1

        async function depositGenesis() {
        // approve all nft
        await genesisToken.connect(addr1).setApprovalForAll(breederDigiRender.address, true)
        expect(await genesisToken.isApprovedForAll(addr1.address, breederDigiRender.address)).to.equal(true)

        await expect(breederDigiRender.connect(addr1).depositGenesis(GENESIS_ID, GENESIS_PRICE_IN_WEI))
            .to.emit(breederDigiRender, "GenesisDeposited")
            .withArgs(GENESIS_ID, addr1.address, GENESIS_PRICE_IN_WEI)
        }

        this.beforeEach(async function() {
            await genesisToken.mintFromOwner(MINT_QUANTITY, addr1.address)
            await spiritToken.airdropMint([addr2.address])
            await spiritToken.whitelistAdventure(adventure.address, true)
        })

        it ("Should be able to deposit genesis token", async function() {
            expect(await genesisToken.balanceOf(addr1.address)).to.equal(MINT_QUANTITY)
            expect(await genesisToken.ownerOf(GENESIS_ID)).to.equal(addr1.address)
            depositGenesis()
        })

        it ("Should be able to enter quest", async function() {
            // test hero address is on whitelist
            expect(await spiritToken.isAdventureWhitelisted(adventure.address)).to.equal(true)

            expect(await spiritToken.balanceOf(addr2.address)).to.equal(1)
            expect(await spiritToken.ownerOf(SPIRIT_ID)).to.equal(addr2.address)

            // deposit genesis token with ID = 1
            depositGenesis()

            // approve all spirit
            await spiritToken.connect(addr2).setApprovalForAll(breederDigiRender.address, true)
            expect(await spiritToken.isApprovedForAll(addr2.address, breederDigiRender.address)).to.equal(true)

            // Enter Quest
            await expect(breederDigiRender.connect(addr2).enterHeroQuest(SPIRIT_ID, GENESIS_ID, {value: GENESIS_PRICE_IN_WEI}))
                .to.emit(breederDigiRender, "HeroOnQuest")
                .withArgs(SPIRIT_ID, GENESIS_ID, addr2.address, GENESIS_PRICE_IN_WEI)
        })
    })


})