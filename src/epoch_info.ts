// fetch getEpochInfo and write metrics

import { Connection } from "@solana/web3.js";
import { Gauge } from "prom-client";

export type EpochInfoMetrics = {
    epoch: Gauge,
    slotIndex: Gauge,
    absoluteSlot: Gauge,
    blockHeight: Gauge,
    transactionCount: Gauge,
}

export function newEpochInfoMetrics(): EpochInfoMetrics {
    return {
        epoch: new Gauge({
            name: 'solana_cluster_epoch',
            help: 'Current epoch of the cluster'
        }),
        slotIndex: new Gauge({
            name: 'solana_cluster_slot_index',
            help: 'Current slot index of the cluster'
        }),
        absoluteSlot: new Gauge({
            name: 'solana_cluster_absolute_slot',
            help: 'Current absolute slot of the cluster'
        }),
        blockHeight: new Gauge({
            name: 'solana_cluster_block_height',
            help: 'Current block height of the cluster'
        }),
        transactionCount: new Gauge({
            name: 'solana_cluster_transaction_count',
            help: 'Current transaction count of the cluster'
        }),
    }
}

export async function checkEpochInfo(
    metrics: EpochInfoMetrics,
    conn: Connection,
)
{
    let epochInfo;
    try {
        epochInfo = await conn.getEpochInfo('finalized');
    } catch (e) {
        console.error("Couldn't get epoch info:", e);
        return;
    }

    metrics.epoch.set(epochInfo.epoch);
    metrics.slotIndex.set(epochInfo.slotIndex);
    metrics.absoluteSlot.set(epochInfo.absoluteSlot);
    if(epochInfo.blockHeight) {
        metrics.blockHeight.set(epochInfo.blockHeight);
    }
    if(epochInfo.transactionCount) {
        metrics.transactionCount.set(epochInfo.transactionCount);
    }

}
