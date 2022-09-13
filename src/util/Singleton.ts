export function singleton<T>(create: () => T) {
    var instance: T | undefined;
    return () => {
        if (instance === undefined) instance = create();
        return instance;
    };
}
