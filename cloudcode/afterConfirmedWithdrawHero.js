Moralis.Cloud.afterSave("EventGenesisWithdrawn", async function (request) {
    const confirmed = request.object.get("confirmed");
    const genesisId = request.object.get("genesisId");
    const genesisOwner = request.object.get("genesisOwner");

    if (confirmed) {
        logger.info("Withdrawing genesis")
        const existingListing = await getGenesisListing(genesisId, genesisOwner);
        existingListing.set("withdrawn", true)

        await existingListing.save()
    }
})