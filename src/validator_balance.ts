import { Connection, PublicKey } from "@solana/web3.js";
import { setGauge } from "./prometheus";

async function getValidatorBalance(
    conn: Connection,
    validatorIdentity : PublicKey): Promise<number> {
    let v = await conn.getBalance(validatorIdentity, 'recent');
    return v / 1e9;
}

export async function checkValidatorBalance(conn: Connection,
                                            validatorIdentity : PublicKey,
                                            nodeOutboxPath: string) {
    let balance;
    try {
        balance = await getValidatorBalance(conn, validatorIdentity);
    } catch (e) {
        console.error("Couldn't get validator balance:", e);
        return;
    }
    let labels = new Map<string, string>([
        ["identity", validatorIdentity.toBase58()]
    ]);

    console.info("Validator balance is "+balance);
    await setGauge(nodeOutboxPath, "validator_balance", labels, balance);
}
