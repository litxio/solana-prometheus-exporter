import {Connection} from '@solana/web3.js';
import { setGauge } from './prometheus';

async function getDelinquency(local: Connection,
                           refConns: Connection[]) : Promise<number | null> {
    const localSlotP = local.getSlot('processed');
    let refSlotsP;
    refSlotsP = refConns.map(async c => {
        try {
            return await c.getSlot('processed');
        } catch (e) {
            console.warn("Could not get slot from "+c.rpcEndpoint);
            return 0;
        }
    });
    let localSlot;
    try {
        localSlot = await localSlotP;
    } catch (e) {
        console.warn("Could not get local slot");
        return null;
    }

    let highestRefSlot = 0;
    for(let i=0; i<refSlotsP.length; i++) {
        try {
            console.info("Checking slot", i,":",refConns[i].rpcEndpoint);
            let slot = await refSlotsP[i];
            if(slot > highestRefSlot)
                highestRefSlot = slot;
        } catch (e) {
        }
    }
    return highestRefSlot - localSlot;
}

export async function checkDelinquency(local: Connection,
                                       refConns: Connection[],
                                       nodeOutboxPath: string) {
    let delinquency = await getDelinquency(local, refConns);
    if(delinquency !== null) {
        console.info("Delinquency is "+delinquency);
        await setGauge(nodeOutboxPath, "delinquency", new Map(), delinquency);
    }
}
