// Run the 'solana validators' command and parse the output

import { PublicKey } from "@solana/web3.js";
import * as child_process from "child_process";
import { Gauge } from "prom-client";

export type ValidatorsMetrics = {
    averageSkipRate: Gauge,
    averageStakeWeightedSkipRate: Gauge,
    totalCurrentStake: Gauge,
    totalActiveStake: Gauge,
    totalDelinquentStake: Gauge,
    highestRoot: Gauge,
    highestLastVote: Gauge,
    validatorActivatedStake: Gauge,
    validatorCommission: Gauge,
    validatorCredits: Gauge,
    validatorEpochCredits: Gauge,
    validatorLastVote: Gauge,
    validatorRootSlot: Gauge,
    validatorSkipRate: Gauge,
}

export function newValidatorsMetrics(): ValidatorsMetrics {
    return {
        averageSkipRate: new Gauge({
            name: "average_skip_rate",
            help: "Average skip rate of all validators",
        }),
        averageStakeWeightedSkipRate: new Gauge({
            name: "average_stake_weighted_skip_rate",
            help: "Average stake weighted skip rate of all validators",
        }),
        totalCurrentStake: new Gauge({
            name: "total_current_stake",
            help: "Total current stake of all validators",
        }),
        totalActiveStake: new Gauge({
            name: "total_active_stake",
            help: "Total active stake of all validators",
        }),
        totalDelinquentStake: new Gauge({
            name: "total_delinquent_stake",
            help: "Total delinquent stake of all validators",
        }),
        highestRoot: new Gauge({
            name: "highest_root",
            help: "Highest root slot of all validators",
        }),
        highestLastVote: new Gauge({
            name: "highest_last_vote",
            help: "Highest last vote of all validators",
        }),
        validatorActivatedStake: new Gauge({
            name: "validator_activated_stake",
            help: "Activated stake of a validator",
            labelNames: ["identity"],
        }),
        validatorCommission: new Gauge({
            name: "validator_commission",
            help: "Commission of a validator",
            labelNames: ["identity"],
        }),
        validatorCredits: new Gauge({
            name: "validator_credits",
            help: "Credits of a validator",
            labelNames: ["identity"],
        }),
        validatorEpochCredits: new Gauge({
            name: "validator_epoch_credits",
            help: "Epoch credits of a validator",
            labelNames: ["identity"],
        }),
        validatorLastVote: new Gauge({
            name: "validator_last_vote",
            help: "Last vote of a validator",
            labelNames: ["identity"],
        }),
        validatorRootSlot: new Gauge({
            name: "validator_root_slot",
            help: "Root slot of a validator",
            labelNames: ["identity"],
        }),
        validatorSkipRate: new Gauge({
            name: "validator_skip_rate",
            help: "Skip rate of a validator",
            labelNames: ["identity"],
        }),
    }
}


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
        skipRate: number | null,
        version: string,
        voteAccountityPubkey: string,
    }]
};

export async function checkSolanaValidatorsMetrics(
    metrics: ValidatorsMetrics,
    solanaBinaryPath: string,
    validatorIdentities : [PublicKey] | null,
    rpcUrl: string,
) {

    let parsedOutput: ValidatorsCommandResult;

    try {
        let stdout = child_process.execFileSync(
            solanaBinaryPath,
            ["validators",
             "--output", "json-compact",
             "--url", rpcUrl],
            { maxBuffer: 4194304 }
        );

        // Decode stdout buffer as JSON:
        parsedOutput = JSON.parse(stdout.toString());

    } catch (e) {
        console.error("Couldn't run "+solanaBinaryPath+" validators", e);
        return;
    }

    // await setGauge(nodeOutboxPath,
    //                "average_skip_rate",
    //                new Map(),
    //                parsedOutput.averageSkipRate);

    // await setGauge(nodeOutboxPath,
    //                "average_stake_weighted_skip_rate",
    //                new Map(),
    //                parsedOutput.averageStakeWeightedSkipRate);

    // await setGauge(nodeOutboxPath,
    //                "total_current_stake",
    //                new Map(),
    //                parsedOutput.totalCurrentStake);

    // await setGauge(nodeOutboxPath,
    //                "total_active_stake",
    //                new Map(),
    //                parsedOutput.totalActiveStake);

    // await setGauge(nodeOutboxPath,
    //                "total_delinquent_stake",
    //                new Map(),
    //                parsedOutput.totalDelinquentStake);

    metrics.averageSkipRate.set(parsedOutput.averageSkipRate);
    metrics.averageStakeWeightedSkipRate.set(parsedOutput.averageStakeWeightedSkipRate);
    metrics.totalCurrentStake.set(parsedOutput.totalCurrentStake);
    metrics.totalActiveStake.set(parsedOutput.totalActiveStake);
    metrics.totalDelinquentStake.set(parsedOutput.totalDelinquentStake);

    let highestRoot =
        Math.max(...parsedOutput.validators.map((v) => v.rootSlot));
    let highestLastVote =
        Math.max(...parsedOutput.validators.map((v) => v.lastVote));
    // await setGauge(nodeOutboxPath, "highest_root", new Map(), highestRoot);
    // await setGauge(nodeOutboxPath, "highest_last_vote", new Map(), highestLastVote);
    metrics.highestRoot.set(highestRoot);
    metrics.highestLastVote.set(highestLastVote);

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

    // let activated_stake_gauges = [];
    // let commission_gauges = [];
    // let credits_gauges = [];
    // let epoch_credits_gauges = [];
    // let last_vote_gauges = [];
    // let root_slot_gauges = [];
    // let skip_rate_gauges = [];
    for (let validator of validators) {
        // activated_stake_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.activatedStake
        //     }
        // );

        // commission_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.commission
        //     }
        // );


        // credits_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.credits
        //     }
        // );

        // epoch_credits_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.epochCredits
        //     }
        // );

        // last_vote_gauges.push(
        //     {

        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.lastVote
        //     }
        // );

        // root_slot_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.rootSlot
        //     }
        // );

        // skip_rate_gauges.push(
        //     {
        //         labels: new Map([["identity", validator.identityPubkey]]),
        //         value: validator.skipRate
        //     }
        // );
        metrics.validatorActivatedStake.set({identity: validator.identityPubkey},
                                            validator.activatedStake);
        metrics.validatorCommission.set({identity: validator.identityPubkey},
                                        validator.commission);
        metrics.validatorCredits.set({identity: validator.identityPubkey},
                                     validator.credits);
        metrics.validatorEpochCredits.set({identity: validator.identityPubkey},
                                          validator.epochCredits);
        metrics.validatorLastVote.set({identity: validator.identityPubkey},
                                      validator.lastVote);
        metrics.validatorRootSlot.set({identity: validator.identityPubkey},
                                      validator.rootSlot);
        if(validator.skipRate != null) {
            metrics.validatorSkipRate.set({ identity: validator.identityPubkey },
                validator.skipRate);
        }

    }

    // setGauges(nodeOutboxPath,
    //           "validator_activated_stake",
    //           activated_stake_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_commission",
    //           commission_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_credits",
    //           credits_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_epoch_credits",
    //           epoch_credits_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_last_vote",
    //           last_vote_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_root_slot",
    //           root_slot_gauges);

    // setGauges(nodeOutboxPath,
    //           "validator_skip_rate",
    //           skip_rate_gauges);
}
