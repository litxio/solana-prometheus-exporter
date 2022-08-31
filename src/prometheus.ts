
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
