#!/usr/bin/env node

import {Connection, PublicKey} from '@solana/web3.js';
import { checkDelinquency, DelinquencyMetrics, newDelinquencyMetrics } from './delinquency';
import { checkValidatorBalance, newValidatorBalanceMetrics, ValidatorBalanceMetrics } from './validator_balance';
import { checkSolanaValidatorsMetrics, newValidatorsMetrics, ValidatorsMetrics } from './validators_command';
import { checkEpochInfo, EpochInfoMetrics, newEpochInfoMetrics } from './epoch_info';

import { register, collectDefaultMetrics } from 'prom-client'
import express from 'express'


/*
 * Environment variables:
 *  - SOLANA_BINARY_PATH (required)
 *  - LISTEN_PORT (optional, defaults to 9621)
 *  - METRIC_FREQUENCY (in seconds, how often to check metrics; default 60)
 *  - LOCAL_RPC_URI (full URI; defaults to http://127.0.0.1:8899)
 *  - REFERENCE_RPC_URIS (Comma separated.  delinquency is calculated
 *                        relative to the highest ref validator slot.
 *                        default is "https://api.mainnet-beta.solana.com")
 *  - VALIDATOR_IDENTITY (keypair for the validator.  If missing, validator
 *                        balance is not checked)
 *  - ONLY_OWN_DETAILS (if set, then record the results of 'solana validators'
 *                      only for VALIDATOR_IDENTITY.  Otherwise record all
 *                      validators' info)
 */

type Metrics = {
    validatorsMetrics: ValidatorsMetrics,
    delinquencyMetrics: DelinquencyMetrics,
    validatorBalanceMetrics: ValidatorBalanceMetrics,
    epochInfoMetrics: EpochInfoMetrics,
}

function newMetrics(): Metrics {
    return {
        validatorsMetrics: newValidatorsMetrics(),
        delinquencyMetrics: newDelinquencyMetrics(),
        validatorBalanceMetrics: newValidatorBalanceMetrics(),
        epochInfoMetrics: newEpochInfoMetrics(),
    };
}


async function checkMetrics(metrics: Metrics,
                            solanaBinaryPath: string,
                            localConn: Connection,
                            referenceRpcConns: Connection[],
                            validatorIdentity: string | undefined,
                            onlyOwnDetails: boolean) {
    try {
        await checkDelinquency(
            metrics.delinquencyMetrics,
            localConn,
            referenceRpcConns,
        );
    } catch(e) {
        console.warn("Error checking delinquency:", e);
    }

    if(validatorIdentity) {
        try {
            await checkValidatorBalance(metrics.validatorBalanceMetrics,
                                        localConn,
                                        new PublicKey(validatorIdentity));
        } catch (e) {
            console.warn("Error checking validator balance:", e);
        }
    }

    let validatorsP = checkSolanaValidatorsMetrics(
        metrics.validatorsMetrics,
        solanaBinaryPath,
        (validatorIdentity && onlyOwnDetails)
            ? [new PublicKey(validatorIdentity)]
            : null, // null means fetch and record ALL validators' info
        referenceRpcConns[0].rpcEndpoint,
    );

    let epochInfoP = checkEpochInfo(
        metrics.epochInfoMetrics,
        localConn,
    );

    try {
        await validatorsP;
    } catch (e) {
        console.warn("Error getting metrics from `solana validators`:", e);
    }

    try {
        await epochInfoP;
    } catch (e) {
        console.warn("Error getting epochInfo:", e);
    }
}

async function main() {
    console.log("Starting Solana exporter for Prometheus");

    // enable default metrics like CPU usage, memory usage, etc.
    collectDefaultMetrics({ prefix: "solana_exporter_" })

    const metrics = newMetrics();

    const app = express();
    // expose the metrics for Prometheus to scrape
    app.get('/metrics', async (_req, res) => {
        const result = await register.metrics()
        res.send(result)
    })

    const solanaBinaryPath = process.env.SOLANA_BINARY_PATH;
    if(!solanaBinaryPath)
        throw new Error(
            "SOLANA_BINARY_PATH environment must be set");

    const metricFreq = parseFloat(process.env.METRIC_FREQUENCY || '60');
    const localUri = process.env.LOCAL_RPC_URI || "http://127.0.0.1:8899";
    const referenceRpcUris =
           (process.env.REFERENCE_RPC_URIS
            || "https://api.mainnet-beta.solana.com").split(',');

    const validatorIdentity = process.env.VALIDATOR_IDENTITY;
    const onlyOwnDetails = !!process.env.ONLY_OWN_DETAILS;

    const localConn = new Connection(localUri);
    const referenceConns = referenceRpcUris.map(uri => new Connection(uri));

    const doCheck = () =>
        checkMetrics(
            metrics,
            solanaBinaryPath,
            localConn,
            referenceConns,
            validatorIdentity,
            onlyOwnDetails);

    await doCheck();
    setInterval(doCheck, 1000*metricFreq);

    const port = process.env.LISTEN_PORT || 9621;
    // start the server
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        // @ts-ignore
        console.log('Server listening on port '+port)
    })
}

main();
