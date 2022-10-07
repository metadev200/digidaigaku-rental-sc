const logger = Moralis.Cloud.getLogger();
const ethers = require("ethers");

Moralis.Cloud.afterSave("EventGenesisDeposited", async function (request) {
    const confirmed = request.object.get("confirmed");

    const genesisId = request.object.get("genesisId");
    const genesisOwner = request.object.get("genesisOwner");
    const fee = request.object.get("fee");
    const dateCreated = request.object.get("block_timestamp");

    if (confirmed) {
        const existingListing = await getGenesisListing(genesisId, genesisOwner);
        if (existingListing) {
            logger.info("Re-listing genesis");
            existingListing.set("withdrawn", false);
            existingListing.set("fee", fee);

            await existingListing.save();
        } else {
            logger.info("Listing new genesis");

            const GenesisListing = Moralis.Object.extend("GenesisListing");
            const genesisListing = new GenesisListing();
            const withdrawn = false;
            const onQuest = false;
            const timesRented = 0;
            const earnings = ethers.BigNumber.from("0").toString();

            const params = {
                genesisId,
                genesisOwner,
                fee,
                withdrawn,
                onQuest,
                dateCreated,
                timesRented,
                earnings,
            }

            const httpResponse = await Moralis.Cloud.httpRequest({
                url: `https://digidaigaku.com/metadata/${genesisId}.json`,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })

            const metadata = JSON.parse(httpResponse.text);
            params.metadata = metadata.name;
            params.image = metadata.image;

            await genesisListing.save(params);
        }
    }
})