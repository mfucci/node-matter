import fs from "fs";
import path from "path";

const enum Source {
    Server = "server",
    Client = "client",
}

const enum Storage {
    Ram = "RAM",
    External = "External",
    Persistent = "NVM",
}

interface Command {
    name: string,
    code: number,
    source: Source,
    incoming: boolean,
    outgoing: boolean,
}

interface Attribute {
    name: string,
    code: number,
    side: Source,
    type: string,
    included: boolean,
    storageOption: Storage,
    singleton: number,
    bounded: boolean,
    defaultValue: any,
    reportable: boolean,
    minInterval: number,
    maxInterval: number,
    reportableChange: boolean,
}

interface Cluster {
    name: string,
    code: number,
    define: string,
    side: Source,
    enabled: boolean,
    commands: Command[],
    attributes: Attribute[],
}

interface EndPoint {
    endpointTypeName: string,
    endpointTypeIndex: number,
    profileId: number,
    endpointId: number,
    networkId: number,
    endpointVersion: number,
    deviceIdentifier: number,
}

interface EndPointType {
    name: string,
    deviceTypeName: string,
    deviceTypeCode: number,
    deviceTypeProfileId: number,
    clusters: Cluster[],
}

interface Configuration {
    endpoints: EndPoint[],
    endpointTypes: EndPointType[],
}

const BOOLEAN_FIELDS = ["enabled", "reportableChange", "reportable", "included", "bounded", "incoming", "outgoing"];

export class DeviceConf {
    initialize() {
        const configurationData = fs.readFileSync(path.join(__dirname, "device.zap"), "utf8");
        const configuration = (this.fixBoolean(JSON.parse(configurationData))) as Configuration;

        configuration.endpointTypes.forEach(endpointType => {
            console.log(`Endpoint type: ${endpointType.name} ${endpointType.deviceTypeCode}`);
            endpointType.clusters.forEach(cluster => {
                if (cluster.side === "client" || !cluster.enabled) return;
                console.log(`  Cluster: ${cluster.name} ${cluster.code}`);
                cluster.commands.forEach(command => {
                    if (command.source === "client") return;
                    console.log(`    Command: ${command.name} ${command.code}`);
                });
                cluster.attributes.forEach(attribute => {
                    if (attribute.side === "client" || !attribute.included) return;
                    console.log(`    Attribute: ${attribute.name} ${attribute.code} ${attribute.type} ${attribute.storageOption} ${attribute.defaultValue}`);
                });
            });
        });
    }

    private fixBoolean(conf: any) {
        for (var key in conf) {
            const value = conf[key];
            if (typeof value === "object") {
                this.fixBoolean(value);
            }
            if (BOOLEAN_FIELDS.includes(key)) {
                conf[key] = value === 1;
            }
        }
        return conf;
    }
}
