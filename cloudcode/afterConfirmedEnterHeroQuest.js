Moralis.Cloud.afterSave("EventHeroOnQuest", async function (request) {
    const confirmed = request.object.get("confirmed");
    const spiritId = request.object.get("spiritId");
    const genesisId = request.object.get("genesisId");
    const spiritOwner = request.object.get("spiritOwner");
    const genesisOwner = request.object.get("genesisOwner");
    const fee = request.object.get("fee");

    if (confirmed) {
        // updating quest status
        logger.info("Genesis going on quest");
        logger.info("Updating genesis listing");
        const existingListing = await getGenesisListing(genesisId, genesisOwner);

        existingListing.set("onQuest", true);
        await existingListing.save();

        // listing quest history
        logger.info("creating heroOnQuest listing");
        const HeroOnQuest = Moralis.Object.extend("HeroOnQuest");
        const heroOnQuest = new HeroOnQuest();
        const questCompleted = false;

        const params = {
            genesisId,
            spiritId,
            spiritOwner,
            genesisOwner,
            fee,
            questCompleted,
        }

        await heroOnQuest.save(params);
    }
})