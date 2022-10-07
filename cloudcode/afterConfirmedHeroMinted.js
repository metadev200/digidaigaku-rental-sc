Moralis.Cloud.afterSave("EventHeroMinted", async function (request) {
    const confirmed = request.object.get("confirmed");
    const spiritId = request.object.get("spiritId");
    const genesisId = request.object.get("genesisId");
    const dateClaimed = request.object.get("block_timestamp");
    
    if(confirmed) {
        // updating HeroOnQuest status
        logger.info("Genesis home from quest");
        logger.info("Updating quest status");
        const heroOnQuest = await getHeroOnQuest(spiritId);
        const genesisOwner = heroOnQuest.get("genesisOwner")
        heroOnQuest.set("questCompleted", true);
        heroOnQuest.set("dateClaimed", dateClaimed);
        
        await heroOnQuest.save();

        // updating genesis listing
        logger.info("Updating genesis listing");
        const genesisListing = await getGenesisListing(genesisId, genesisOwner);
        genesisListing.set("onQuest", false);

        await genesisListing.save();
    }
})