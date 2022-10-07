async function getGenesisListing(genesisId, genesisOwner) {
    const query = new Moralis.Query("GenesisListing");
    query.equalTo("genesisId", genesisId);
    query.equalTo("genesisOwner", genesisOwner);
    const result = await query.first();

    return result;
}

async function getHeroOnQuest(spiritId) {
    const query = new Moralis.Query("HeroOnQuest");
    query.equalTo("spiritId", spiritId);
    const result = await query.first();

    return result;
}