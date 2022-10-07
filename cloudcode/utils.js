async function getGenesisListing(genesisId, genesisOwner) {
    const query = new Moralis.Query("GenesisListing");
    query.equalTo("genesisId", genesisId);
    query.equalTo("genesisOwner", genesisOwner);
    const result = await query.first();

    return result;
}