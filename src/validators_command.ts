// Run the 'solana validators' command and parse the output

import { PublicKey } from "@solana/web3.js";
import * as child_process from "child_process";
import { setGauge, setGauges } from "./prometheus";

type ValidatorsCommandResult = {
    averageSkipRate: number,
    averageStakeWeightedSkipRate: number,
    totalCurrentStake: number,
    totalActiveStake: number,
    totalDelinquentStake: number,
    validators: [{
        activatedStake: number,
        commission: number,
        credits: number,
        delinquent: boolean,
        epochCredits: number,
        identityPubkey: string,
        lastVote: number,
        rootSlot: number,
        skipRate: number,
        version: string,
        voteAccountityPubkey: string,
    }]
};

export async function checkSolanaValidatorsMetrics(
    solanaBinaryPath: string,
    validatorIdentities : [PublicKey] | null,
    nodeOutboxPath: string) {

    let parsedOutput: ValidatorsCommandResult;

    try {
        let stdout = child_process.execFileSync(
            solanaBinaryPath,
            ["validators", "--output", "json-compact"]
        );

        // Decode stdout buffer as JSON:
        parsedOutput = JSON.parse(stdout.toString());

    } catch (e) {
        console.error("Couldn't run "+solanaBinaryPath+" validators", e);
        return;
    }

    await setGauge(nodeOutboxPath,
                   "average_skip_rate",
                   new Map(),
                   parsedOutput.averageSkipRate);

    await setGauge(nodeOutboxPath,
                   "average_stake_weighted_skip_rate",
                   new Map(),
                   parsedOutput.averageStakeWeightedSkipRate);

    await setGauge(nodeOutboxPath,
                   "total_current_stake",
                   new Map(),
                   parsedOutput.totalCurrentStake);

    await setGauge(nodeOutboxPath,
                   "total_active_stake",
                   new Map(),
                   parsedOutput.totalActiveStake);

    await setGauge(nodeOutboxPath,
                   "total_delinquent_stake",
                   new Map(),
                   parsedOutput.totalDelinquentStake);

    let highestRoot =
        Math.max(...parsedOutput.validators.map((v) => v.rootSlot));
    let highestLastVote =
        Math.max(...parsedOutput.validators.map((v) => v.lastVote));
    await setGauge(nodeOutboxPath, "highest_root", new Map(), highestRoot);
    await setGauge(nodeOutboxPath, "highest_last_vote", new Map(), highestLastVote);

    let validators;
    if (validatorIdentities) {
        let includedIdentitiesBase58 =
            new Set(validatorIdentities.map((validator) => validator.toBase58()));
        validators = parsedOutput.validators.filter((v) => {
            return includedIdentitiesBase58.has(v.identityPubkey);
        });
    } else {
        validators = parsedOutput.validators;
    }

    console.log("Saving metrics for "+validators.length+" validators");

    let activated_stake_gauges = [];
    let commission_gauges = [];
    let credits_gauges = [];
    let epoch_credits_gauges = [];
    let last_vote_gauges = [];
    let root_slot_gauges = [];
    let skip_rate_gauges = [];
    for (let validator of validators) {
        activated_stake_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.activatedStake
            }
        );

        commission_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.commission
            }
        );


        credits_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.credits
            }
        );

        epoch_credits_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.epochCredits
            }
        );

        last_vote_gauges.push(
            {

                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.lastVote
            }
        );

        root_slot_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.rootSlot
            }
        );

        skip_rate_gauges.push(
            {
                labels: new Map([["identity", validator.identityPubkey]]),
                value: validator.skipRate
            }
        );
    }

    setGauges(nodeOutboxPath,
              "validator_activated_stake",
              activated_stake_gauges);

    setGauges(nodeOutboxPath,
              "validator_commission",
              commission_gauges);

    setGauges(nodeOutboxPath,
              "validator_credits",
              credits_gauges);

    setGauges(nodeOutboxPath,
              "validator_epoch_credits",
              epoch_credits_gauges);

    setGauges(nodeOutboxPath,
              "validator_last_vote",
              last_vote_gauges);

    setGauges(nodeOutboxPath,
              "validator_root_slot",
              root_slot_gauges);

    setGauges(nodeOutboxPath,
              "validator_skip_rate",
              skip_rate_gauges);
}
