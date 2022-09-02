import { SQLite } from '@awesome-cordova-plugins/sqlite';
import { Capacitor } from '@capacitor/core';

export const client = async (context, { dbname, models, force = false }) => {
  const isNative = Capacitor.getPlatform() !== 'web';
  const _db = isNative
    ? await SQLite.create({
        name: dbname,
        location: 'default',
      })
    : {};

  if (isNative) {
    _db.transaction(async (tx) => {
      if (force) tx.executeSql('DROP TABLE IF EXISTS last_sync');
      await tx.executeSql(
        'CREATE TABLE IF NOT EXISTS last_sync ( ' +
          ' id INTEGER PRIMARY KEY, ' +
          '  action VARCHAR(45), ' +
          '  sync_table VARCHAR(255), ' +
          '  date DATETIME, ' +
          '  date_last DATETIME, ' +
          '  status VARCHAR(45) ' +
          '); ',
        []
      );
    });
    console.log('WORKER', context.worker.api);
    context.worker.api = 'http://10.60.10.99:3000/'
    console.log('WORKER_2', context.worker.api);
    
  }
  
  _db.isNative = isNative;
  context._db = _db;
  

  context._models = {};
  models.map(async (model) => {
    const _m = new model();
    await _m.initDatabase({ _db, force });
    context._models[_m.table] = _m;
  });


  return context;
};
