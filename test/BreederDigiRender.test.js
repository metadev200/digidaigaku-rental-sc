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


})