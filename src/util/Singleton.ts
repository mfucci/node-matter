export function Singleton<T>(create: () => T) {
    var instance: T | undefined;

    return () => {
        return instance ?? (instance = create());
    }
}
