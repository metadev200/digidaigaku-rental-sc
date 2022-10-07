const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const { onlyGivenAddressCanInvoke } = require("./helpers");


describe("breederDigiRenter", function () {

    // ===== Reference for Mainnet Fork Test =====
    // DigiDaigaku genesisToken =
    //     DigiDaigaku(0xd1258DB6Ac08eB0e625B75b371C023dA478E94A9);
    // DigiDaigakuHeroes heroToken =
    //     DigiDaigakuHeroes(0xA225632b2EBc32B9f4278fc8E3FE5C6f6496D970);
    // DigiDaigakuSpirits spiritToken =
    //     DigiDaigakuSpirits(0xa8824EeE90cA9D2e9906D377D36aE02B1aDe5973);
    // HeroAdventure adventure =
    //     HeroAdventure(0xE60fE8C4C60Fd97f939F5136cCeb7c41EaaA624d);

    const MINT_QUANTITY = 5
    const PRICE_IN_WEI = ethers.utils.parseEther("0.1")

    const GENESIS_ID = 1
    const SPIRIT_ID = 1

    let genesisToken, heroToken, spiritToken, adventure;
    let breederDigiRenter;

    let accounts;
    let deployer, genesisOwner, spiritOwner, addr1, addr2;

    this.beforeEach(async function () {
        accounts = await ethers.getSigners();
        [deployer, genesisOwner, spiritOwner, addr1, addr2] = accounts;

        const GenesisToken = await ethers.getContractFactory("DigiDaigaku")
        genesisToken = await GenesisToken.deploy()

        const DigiDaigakuHeroes = await ethers.getContractFactory("DigiDaigakuHeroes")
        heroToken = await DigiDaigakuHeroes.deploy()

        const DigiDaigakuSpirits = await ethers.getContractFactory("DigiDaigakuSpirits")
        spiritToken = await DigiDaigakuSpirits.deploy()

        const HeroAdventure = await ethers.getContractFactory("HeroAdventure")
        adventure = await HeroAdventure.deploy(heroToken.address, genesisToken.address, spiritToken.address)

        const BreederDigiRenter = await ethers.getContractFactory("BreederDigiRenter")
        breederDigiRenter = await BreederDigiRenter.deploy(genesisToken.address, heroToken.address, spiritToken.address, adventure.address)

        await genesisToken.mintFromOwner(MINT_QUANTITY, genesisOwner.address)

        const SPIRIT_OWNERS = Array(MINT_QUANTITY).fill(spiritOwner.address)
        await spiritToken.airdropMint(SPIRIT_OWNERS)
    })

    describe("Setup", function () {
        it("Should have the correct GenesisToken address", async function () {
            expect(await breederDigiRenter.genesisToken()).to.equal(genesisToken.address)
        })

        it("Should have the correct DigiDaigakuHeroes address", async function () {
            expect(await breederDigiRenter.heroToken()).to.equal(heroToken.address)
        })

        it("Should have the correct DigiDaigakuSpirits address", async function () {
            expect(await breederDigiRenter.spiritToken()).to.equal(spiritToken.address)
        })

        it("Should have the correct HeroAdventure address", async function () {
            expect(await breederDigiRenter.adventure()).to.equal(adventure.address)
        })
    })

    describe("DepositGenesis", function () {
        this.beforeEach(async function () {
            // approve all nft
            await genesisToken.connect(genesisOwner).setApprovalForAll(breederDigiRenter.address, true)
            expect(await genesisToken.isApprovedForAll(genesisOwner.address, breederDigiRenter.address)).to.equal(true)
        })

        it("Should be able to deposit genesis token", async function () {
            expect(await genesisToken.balanceOf(genesisOwner.address)).to.equal(MINT_QUANTITY)
            expect(await genesisToken.ownerOf(GENESIS_ID)).to.equal(genesisOwner.address)

            await expect(breederDigiRenter.connect(genesisOwner).depositGenesis(GENESIS_ID, PRICE_IN_WEI))
                .to.emit(breederDigiRenter, "GenesisDeposited")
                .withArgs(GENESIS_ID, genesisOwner.address, PRICE_IN_WEI)

            expect(await breederDigiRenter.genesisFee(GENESIS_ID)).to.equal(PRICE_IN_WEI)
        })

        it("Should not be able to deposit unowned genesis token", async function () {
            expect(await genesisToken.balanceOf(genesisOwner.address)).to.equal(MINT_QUANTITY)
            expect(await genesisToken.ownerOf(GENESIS_ID)).to.equal(genesisOwner.address)

            await onlyGivenAddressCanInvoke({
                contract: breederDigiRenter,
                fnc: "depositGenesis",
                args: [GENESIS_ID, PRICE_IN_WEI],
                address: genesisOwner,
                accounts,
                skipPassCheck: false,
            })
        })
    })

    describe("WithdrawGenesis", function () {
        this.beforeEach(async function () {
            // approve all nft
            await genesisToken.connect(genesisOwner).setApprovalForAll(breederDigiRenter.address, true)
            expect(await genesisToken.isApprovedForAll(genesisOwner.address, breederDigiRenter.address)).to.equal(true)

            const PRICE_IN_WEI = ethers.utils.parseEther("0.1")
            await expect(breederDigiRenter.connect(genesisOwner).depositGenesis(GENESIS_ID, PRICE_IN_WEI))
        })

        it("Should be able to withdraw genesis token", async function () {
            await expect(breederDigiRenter.connect(genesisOwner).withdrawGenesis(GENESIS_ID))
                .to.emit(breederDigiRenter, "GenesisWithdrawn")
                .withArgs(GENESIS_ID, genesisOwner.address)

            expect(await breederDigiRenter.genesisFee(GENESIS_ID)).to.equal(0)
        })

        it("Should not be able to withdraw unowned genesis token", async function () {
            await onlyGivenAddressCanInvoke({
                contract: breederDigiRenter,
                fnc: "withdrawGenesis",
                args: [GENESIS_ID],
                address: genesisOwner,
                accounts,
                skipPassCheck: false,
                reason: "BreederDigiRenter.onlyGenesisOwner: not owner of genesis"
            })
        })
    })

    describe("UpdateGenesisFee", function () {
        this.beforeEach(async function () {
            // approve all nft
            await genesisToken.connect(genesisOwner).setApprovalForAll(breederDigiRenter.address, true)
            expect(await genesisToken.isApprovedForAll(genesisOwner.address, breederDigiRenter.address)).to.equal(true)

            const PRICE_IN_WEI = ethers.utils.parseEther("0.1")
            await expect(breederDigiRenter.connect(genesisOwner).depositGenesis(GENESIS_ID, PRICE_IN_WEI))
        })

        it("Should be able to update genesisFee", async function () {
            await expect(breederDigiRenter.connect(genesisOwner).updateGenesisFee(GENESIS_ID, PRICE_IN_WEI.mul(2)))
                .to.emit(breederDigiRenter, "GenesisFeeUpdated")
                .withArgs(GENESIS_ID, PRICE_IN_WEI, PRICE_IN_WEI.mul(2))

            expect(await breederDigiRenter.genesisFee(GENESIS_ID)).to.equal(PRICE_IN_WEI.mul(2))
        })

        it("Should not be able to update genesisFee of unowned token", async function () {
            await onlyGivenAddressCanInvoke({
                contract: breederDigiRenter,
                fnc: "updateGenesisFee",
                args: [GENESIS_ID, PRICE_IN_WEI.mul(2)],
                address: genesisOwner,
                accounts,
                skipPassCheck: false,
                reason: "BreederDigiRenter.onlyGenesisOwner: not owner of genesis"
            })
        })
    })

    describe("EnterHeroQuest", function () {
        this.beforeEach(async function () {
            // whitelisting in local and testnet, already active in mainnet
            await spiritToken.whitelistAdventure(adventure.address, true)

            // approve for genesis 
            await genesisToken.connect(genesisOwner).setApprovalForAll(breederDigiRenter.address, true)
            expect(await genesisToken.isApprovedForAll(genesisOwner.address, breederDigiRenter.address)).to.equal(true)

            // depositing genesis
            await expect(breederDigiRenter.connect(genesisOwner).depositGenesis(GENESIS_ID, PRICE_IN_WEI))

            // approve for spirit
            await spiritToken.connect(spiritOwner).setApprovalForAll(breederDigiRenter.address, true)
            expect(await spiritToken.isApprovedForAll(spiritOwner.address, breederDigiRenter.address)).to.equal(true)
        })

        it("Should be able to rent genesis token", async function () {
            const initialOwnerBalance = await ethers.provider.getBalance(genesisOwner.address)

            await expect(breederDigiRenter.connect(spiritOwner).enterHeroQuest(SPIRIT_ID, GENESIS_ID, { value: PRICE_IN_WEI }))
                .to.emit(breederDigiRenter, "HeroOnQuest")
                .withArgs(SPIRIT_ID, GENESIS_ID, spiritOwner.address, PRICE_IN_WEI)

            expect(await ethers.provider.getBalance(genesisOwner.address)).to.equal(initialOwnerBalance.add(PRICE_IN_WEI))
        })

        it("Should not be able to rent using unowned spirit token", async function () {
            await onlyGivenAddressCanInvoke({
                contract: breederDigiRenter,
                fnc: "enterHeroQuest",
                args: [SPIRIT_ID, GENESIS_ID, { value: PRICE_IN_WEI }],
                address: spiritOwner,
                accounts,
                skipPassCheck: false,
                reason: "BreederDigiRenter.enterHeroQuest: not owner of spirit"
            })
        })

        it("Should not be able to rent already adventuring spirit", async function () {
            await breederDigiRenter.connect(spiritOwner).enterHeroQuest(SPIRIT_ID, GENESIS_ID, { value: PRICE_IN_WEI })
            await expect(breederDigiRenter.connect(spiritOwner).enterHeroQuest(SPIRIT_ID, GENESIS_ID, { value: PRICE_IN_WEI })).to.be.revertedWith("BreederDigiRenter.onlyGenesisAvailable: genesis is on adventure")
        })
    })
})