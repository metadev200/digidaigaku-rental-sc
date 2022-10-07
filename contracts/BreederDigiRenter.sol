// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./Adventure/DigiDaigaku.sol";
import "./Adventure/DigiDaigakuHeroes.sol";
import "./Adventure/DigiDaigakuSpirits.sol";
import "./Adventure/HeroAdventure.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract BreederDigiRenter is Context {
    DigiDaigaku genesisToken =
        DigiDaigaku(0xd1258DB6Ac08eB0e625B75b371C023dA478E94A9);
    DigiDaigakuHeroes heroToken =
        DigiDaigakuHeroes(0xA225632b2EBc32B9f4278fc8E3FE5C6f6496D970);
    DigiDaigakuSpirits spiritToken =
        DigiDaigakuSpirits(0xa8824EeE90cA9D2e9906D377D36aE02B1aDe5973);
    HeroAdventure adventure =
        HeroAdventure(0xE60fE8C4C60Fd97f939F5136cCeb7c41EaaA624d);
    ERC20 weth = ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    mapping(uint16 => uint256) public genesisFee;

    mapping(uint16 => bool) public genesisIsDeposited;
    mapping(uint16 => bool) public genesisIsOnAdventure;
    mapping(uint16 => address) private _genesisOwner;

    mapping(uint16 => address) private _spiritOwner;
    mapping(uint16 => uint16) private _spiritGenesisAdventurePair;

    event GenesisDeposited(uint16 genesisId, address genesisOwner, uint256 fee);
    event GenesisWithdrawn(uint16 genesisId, address genesisOwner);
    event GenesisFeeUpdated(uint16 genesisId, uint256 oldFee, uint256 newFee);

    event HeroOnQuest(
        uint16 spiritId,
        uint16 genesisId,
        address spiritOwner,
        uint256 fee
    );
    event HeroMinted(uint16 spiritId, uint16 genesisId, address spiritOwner);
    event ForceClaim(uint16 spiritId, uint16 genesisId, address genesisOwner);

    modifier onlyGenesisOwner(uint16 genesisId) {
        require(
            _msgSender() == _genesisOwner[genesisId],
            "BreederDigiRenter.onlyGenesisOwner: not owner of genesis"
        );
        _;
    }

    modifier onlySpiritOwner(uint16 spiritId) {
        require(
            _msgSender() == _spiritOwner[spiritId],
            "BreederDigiRenter.onlySpiritOwner: not owner of spirit"
        );
        _;
    }

    modifier onlyGenesisDeposited(uint16 genesisId) {
        require(
            genesisIsDeposited[genesisId],
            "BreederDigiRenter.onlyGenesisDeposited: genesis not deposited"
        );
        _;
    }

    function depositGenesis(uint16 genesisId, uint256 fee) external {
        genesisToken.transferFrom(_msgSender(), address(this), genesisId);
        _genesisOwner[genesisId] = _msgSender();
        genesisFee[genesisId] = fee;
        genesisIsDeposited[genesisId] = true;

        emit GenesisDeposited(genesisId, _msgSender(), fee);
    }

    function withdrawGenesis(uint16 genesisId)
        external
        onlyGenesisOwner(genesisId)
        onlyGenesisDeposited(genesisId)
    {
        require(
            !genesisIsOnAdventure[genesisId],
            "BreederDigiRenter.withdrawGenesis: genesis is on adventure"
        );

        genesisToken.transferFrom(address(this), _msgSender(), genesisId);
        _genesisOwner[genesisId] = address(0);
        genesisFee[genesisId] = 0;
        genesisIsDeposited[genesisId] = false;

        emit GenesisWithdrawn(genesisId, _msgSender());
    }

    function updateGenesisFee(uint16 genesisId, uint256 newFee)
        external
        onlyGenesisOwner(genesisId)
    {
        require(
            !genesisIsOnAdventure[genesisId],
            "BreederDigiRenter.updateGenesisFee: genesis is on adventure"
        );
        uint256 oldFee = genesisFee[genesisId];
        genesisFee[genesisId] = newFee;

        emit GenesisFeeUpdated(genesisId, oldFee, newFee);
    }

    /**
     * @notice Provide owned spiritId and available genesisId, fee is to explicit to prevent sandwich attack
     */
    function enterHeroQuest(
        uint16 spiritId,
        uint16 genesisId,
        uint256 fee
    ) external onlyGenesisDeposited(genesisId) {
        require(
            spiritToken.ownerOf(spiritId) == _msgSender(),
            "BreederDigiRenter.enterHeroQuest: not owner of spirit"
        );

        require(
            !genesisIsOnAdventure[genesisId],
            "BreederDigiRenter.enterHeroQuest: genesis is on adventure"
        );

        require(
            genesisFee[genesisId] == fee,
            "BreederDigiRenter.enterHeroQuest: fee has changed"
        );

        _spiritOwner[spiritId] = _msgSender();
        genesisIsOnAdventure[genesisId] = true;
        _spiritGenesisAdventurePair[spiritId] = genesisId;

        spiritToken.transferFrom(_msgSender(), address(this), spiritId);
        genesisToken.approve(address(adventure), genesisId);
        adventure.enterQuest(spiritId, genesisId);
        weth.transferFrom(_msgSender(), _genesisOwner[genesisId], fee);

        emit HeroOnQuest(spiritId, genesisId, _msgSender(), fee);
    }

    function mintHero(uint16 spiritId) external onlySpiritOwner(spiritId) {
        uint16 genesisId = _spiritGenesisAdventurePair[spiritId];

        require(
            genesisIsOnAdventure[genesisId],
            "BreederDigiRenter.enterHeroQuest: genesis is not on adventure"
        );

        genesisIsOnAdventure[genesisId] = false;

        adventure.exitQuest(spiritId, true);

        heroToken.transferFrom(address(this), _msgSender(), spiritId);

        emit HeroMinted(spiritId, genesisId, _msgSender());
    }
}
