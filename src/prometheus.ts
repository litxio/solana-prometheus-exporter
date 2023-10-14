
import * as fs from 'fs';
import path from 'path';

export async function setGauge(outboxPath: string,
                               metric: string,
                               labels: Map<string, string>,
                               value: number) {
    let labelStr;
    if(labels.size == 0)
        labelStr = "";
    else {
        labelStr = "{";
        let i=0;
        for(let [k,v] of labels) {
            labelStr += `${k}="${v}"`;
            if(i+1 < labels.size)
                labelStr+=",";
        }
        labelStr += "}";
    }
    fs.writeFile(path.join(outboxPath, `${metric}.prom`),
                  `# TYPE ${metric} gauge\n${metric}${labelStr} ${value}\n`,
                  (e) => {if(e) console.error(e);});
}



export function setGauges(outboxPath: string,
                          metric: string,
                          labelValues: {labels: Map<string, string>, value: number}[]
                         ) {
    let f = fs.openSync(path.join(outboxPath, `${metric}.prom`), 'w');
    fs.writeSync(f, `# TYPE ${metric} gauge\n\n`);
    for (let lv of labelValues) {
        let labelStr;
        if (lv.labels.size == 0)
            labelStr = "";
        else {
            labelStr = "{";
            let i = 0;
            for (let [k, v] of lv.labels) {
                labelStr += `${k}="${v}"`;
                if (i + 1 < lv.labels.size)
                    labelStr += ",";
            }
            labelStr += "}";
        }
        fs.writeSync(f, `${metric}${labelStr} ${lv.value}\n`);
    }
}
