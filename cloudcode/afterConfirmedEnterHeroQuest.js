Moralis.Cloud.afterSave("EventHeroOnQuest", async function (request) {
    const confirmed = request.object.get("confirmed");
    const spiritId = request.object.get("spiritId");
    const genesisId = request.object.get("genesisId");
    const spiritOwner = request.object.get("spiritOwner");
    const genesisOwner = request.object.get("genesisOwner");
    const fee = request.object.get("fee");
    const dateCreated = request.object.get("block_timestamp");

    if (confirmed) {
        // updating quest status
        logger.info("Genesis going on quest");
        logger.info("Updating genesis listing");
        const genesisListing = await getGenesisListing(genesisId, genesisOwner);

        genesisListing.set("onQuest", true);
        genesisListing.set("timesRented", genesisListing.get("timesRented") + 1);

        const currentEarnings = ethers.BigNumber.from(genesisListing.get("earnings"))
        const currentFee = ethers.BigNumber.from(genesisListing.get("fee"))
        genesisListing.set("earnings", currentEarnings.add(currentFee).toString());

        await genesisListing.save();

        // listing quest history
        logger.info("creating heroOnQuest listing");
        const HeroOnQuest = Moralis.Object.extend("HeroOnQuest");
        const heroOnQuest = new HeroOnQuest();
        const questCompleted = false;
        const dateClaimed = new Date(0);

        const params = {
            genesisId,
            spiritId,
            spiritOwner,
            genesisOwner,
            fee,
            questCompleted,
            dateCreated,
            dateClaimed,
        }

        await heroOnQuest.save(params);
    }
})