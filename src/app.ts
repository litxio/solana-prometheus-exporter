#!/usr/bin/env node

import {Connection, PublicKey} from '@solana/web3.js';
import { checkDelinquency } from './delinquency';
import { checkValidatorBalance } from './validator_balance';


/*
 * Environment variables:
 *  - NODE_EXPORTER_OUTBOX_PATH (required)
 *  - METRIC_FREQUENCY (in seconds, how often to check metrics; default 60)
 *  - LOCAL_RPC_URI (full URI; defaults to http://127.0.0.1:8899)
 *  - REFERENCE_RPC_URIS (Comma separated.  delinquency is calculated
 *                        relative to the highest ref validator slot.
 *                        default is "https://api.mainnet-beta.solana.com")
 *  - VALIDATOR_IDENTITY (keypair for the validator.  If missing, validator
 *                        balance is not checked)
 */


async function checkMetrics(outboxPath: string,
                            localConn: Connection,
                            referenceRpcConns: Connection[],
                            validatorIdentity: string | undefined) {
    try {
        await checkDelinquency(localConn,
            referenceRpcConns,
            outboxPath);
    } catch(e) {
        console.warn("Error checking delinquency:", e);
    }

    if(validatorIdentity) {
        try {
            await checkValidatorBalance(localConn,
                                        new PublicKey(validatorIdentity),
                                        outboxPath);
        } catch (e) {
            console.warn("Error checking validator balance:", e);
        }
    }
}

async function main() {
    console.log("Starting Solana exporter for Prometheus");

    const outboxPath = process.env.NODE_EXPORTER_OUTBOX_PATH;
    if(!outboxPath)
        throw new Error(
            "NODE_EXPORTER_OUTBOX_PATH environment must be set");
    const metricFreq = parseFloat(process.env.METRIC_FREQUENCY || '60');
    const localUri = process.env.LOCAL_RPC_URI || "http://127.0.0.1:8899";
    const referenceRpcUris =
           (process.env.REFERENCE_RPC_URIS
            || "https://api.mainnet-beta.solana.com").split(',');

    const validatorIdentity = process.env.VALIDATOR_IDENTITY;

    const localConn = new Connection(localUri);
    const referenceConns = referenceRpcUris.map(uri => new Connection(uri));

    const doCheck = () =>
        checkMetrics(
            outboxPath,
            localConn,
            referenceConns,
            validatorIdentity);

    await doCheck();
    setInterval(doCheck, 1000*metricFreq);

}

main();
