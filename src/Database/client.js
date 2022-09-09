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

  }
  
  context.worker.api = context.environment.development
    ? context.settings.apidev
    : context.settings.api;
  
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
