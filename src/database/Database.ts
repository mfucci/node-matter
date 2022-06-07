/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

type Record<T> = {
    id: string,
    revision: number,
    value: T,
}

type NewRecord<T> = {
    id: string,
    value: T,
}

type RecordListener<T> = (value?: Record<T>) => void;

export class Database {
    private readonly records = new Map<string, Record<any>>();
    private readonly recordListeners = new Map<string, RecordListener<any>[]>();

    constructor() {}

    addRecordListener<T>(id: string, listener: RecordListener<T>) {
        var listeners = this.recordListeners.get(id);
        if (listeners === undefined) {
            listeners = new Array<RecordListener<T>>();
            this.recordListeners.set(id, listeners);
        }
        listeners.push(listener);
        listener(this.records.get(id));
    }

    removeRecordListener<T>(id: string, listener: RecordListener<T>) {
        var listeners = this.recordListeners.get(id);
        if (listeners === undefined) return;
        listeners.filter(listener => listener !== listener);
        if (listeners.length === 0) {
            this.recordListeners.delete(id);
        }
    }

    getRecord<T>(id: string, defaultProvider?: () => T): Record<T> {
        var result = this.records.get(id);
        if (result === undefined) {
            if (defaultProvider === undefined) throw new Error(`Record ${id} not found`);
            result = {id, revision: 0, value: defaultProvider()};
            this.records.set(id, result);
            this.notifyUpdate(id, result);
        }
        return {...result};
    }

    addRecord<T>(record: NewRecord<T>) {
        const {id} = record;
        if (this.records.has(id)) throw new Error(`Record ${id} already exists`);
        const newRecord = {...record, revision: 0};
        this.records.set(id, newRecord);
        this.notifyUpdate(id, newRecord);
    }

    addRecords(values: NewRecord<any>[]) {
        values.forEach(record => this.addRecord(record));
    }

    updateRecord<T>(id: string, update: ((value: Record<T>) => void) | Partial<T>): Record<T>  {
        var result = {...this.getRecord(id)} as Record<T>;
        if (typeof update === "function") {
            update(result);
        } else {
            result = { ...result, ...update};
        }
        result.revision++;
        this.records.set(id, result);
        this.notifyUpdate(id, result);
        return result;
    }

    remove(id: string) {
        this.records.delete(id);
        this.notifyUpdate(id, undefined);
    }

    private notifyUpdate(id: string, record?: Record<any>) {
        var listeners = this.recordListeners.get(id);
        if (listeners === undefined) return;
        listeners.forEach(listener => listener(record));
    }
}
