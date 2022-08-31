import mysql from 'mysql2/promise';

export const server = async (context, { dbname, host, user, pass, models }) => {
  try {
    const _database = await mysql.createConnection({
      host,
      user,
      password: pass,
      database: dbname,
    });
    _database.isNative = false;
    context._database = _database;

    context._models = {};
    models.map(async (model) => {
      const _m = new model();
      context._models[_m.table] = _m;
    });

  } catch (error) {
    console.log(error);
  }
  return context;
};
