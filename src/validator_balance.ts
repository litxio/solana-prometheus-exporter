import { Connection, PublicKey } from "@solana/web3.js";
import { Gauge } from "prom-client";

export type ValidatorBalanceMetrics = {
    validatorBalance: Gauge
}

export function newValidatorBalanceMetrics(): ValidatorBalanceMetrics {
    return {
        validatorBalance: new Gauge({
            name: 'validator_balance',
            help: 'Validator balance',
            labelNames: ['identity']
        })
    }
}

async function getValidatorBalance(
    conn: Connection,
    validatorIdentity : PublicKey
): Promise<number>
{
    let v = await conn.getBalance(validatorIdentity, 'recent');
    return v / 1e9;
}

export async function checkValidatorBalance(
    metrics: ValidatorBalanceMetrics,
    conn: Connection,
    validatorIdentity : PublicKey)
{
    let balance;
    try {
        balance = await getValidatorBalance(conn, validatorIdentity);
    } catch (e) {
        console.error("Couldn't get validator balance:", e);
        return;
    }

    metrics.validatorBalance.set({identity: validatorIdentity.toBase58()}, balance);

    // let labels = new Map<string, string>([
    //     ["identity", validatorIdentity.toBase58()]
    // ]);

    console.info("Validator balance is "+balance);
    // await setGauge(nodeOutboxPath, "validator_balance", labels, balance);
}
