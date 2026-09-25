// La API comparte una sola conexión SQLite, así que las transacciones se
// serializan: una transacción no empieza hasta que termine la anterior.
let queue = Promise.resolve();

export const withTransaction = (db, work) => {
    const run = queue.then(async () => {
        await db.exec('BEGIN');
        try {
            const result = await work(db);
            await db.exec('COMMIT');
            return result;
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    });
    // La cola sigue aunque esta transacción falle
    queue = run.catch(() => {});
    return run;
};
