import { Database } from "../database/Database";

const CLUSTER_ID = 0x06;

const enum Command {
    Off = 0,
    On = 1,
    Toggle = 2,
}

const enum Attribute {
    OnOff = 0,
}

const enum RecordId {
    OnOff = "OnOff",
}

export class OnOffCluster {
    constructor(
        private readonly database: Database) {
        database.addRecord<boolean>({id: RecordId.OnOff, value: false});
    }

    handleCommand(id: Command, data: any) {
        switch (id) {
            case Command.On:
                this.database.updateRecord<boolean>(RecordId.OnOff, true);
                break;
            case Command.Off:
                this.database.updateRecord<boolean>(RecordId.OnOff, false);
                break;
            case Command.Toggle:
                this.database.updateRecord<boolean>(RecordId.OnOff, onOffRecord => onOffRecord.value = !onOffRecord.value);
                break;
            default:
                throw new Error(`Unsupported command ${id}`);
        }
    }
}
