interface Field<T> { value: T, optional: boolean }
interface OptionalField<T> extends Field<T> { optional: true }
const Field = <T,>(value: T): Field<T> => ({ value, optional: false });
const OptionalField = <T,>(value: T): OptionalField<T> => ({ value, optional: true });

type Atr = { [key: string]: Field<any> | OptionalField<any> };
type OptionalKeys<T extends Atr> = {[K in keyof T]: T[K] extends OptionalField<any> ? K : never}[keyof T];
type MandatoryKeys<T extends Atr> = {[K in keyof T]: T[K] extends OptionalField<any> ? never : K}[keyof T];
type JsType<T extends Atr> = { [K in OptionalKeys<T>]?: T[K]["value"] } & { [K in MandatoryKeys<T>]: T[K]["value"] };



type OptConf<T extends Atr> = { [K in OptionalKeys<T>]?: true };
type MakeMandatory<T extends Atr, C extends OptConf<T>> = 
    Omit<T, keyof C>
    & { [ K in Extract<keyof T, keyof C>]: Field<T[K]["value"]> }
const MakeMandatory = <T extends Atr, C extends OptConf<T>>(atr: T, conf: C): MakeMandatory<T, C> => {
    const result = { ...atr };
    for (const key in conf) {
        const { value } = result[key];
        (result as any)[key] = { value, optional: false };
    }
    return result;
};

const t = {
    a: { value: 1, optional: false } as Field<number>,
    b: { value: 1, optional: true } as OptionalField<number>,
    c: { value: 1, optional: true } as OptionalField<number>,
}
type tt = JsType<typeof t>;
const tm = MakeMandatory(t, { b: true });
type tmt = JsType<typeof tm>;


console.log(tm);