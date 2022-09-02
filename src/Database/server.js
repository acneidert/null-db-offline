import mysql from 'mysql2/promise';
import SqlBricks from 'sql-bricks';
import deserialize from 'nullstack/shared/deserialize';
import mysqlBricks from 'mysql-bricks';

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

  Object.values(context._models).forEach((model) => {
    // Create
    context.server.post(
      `/api/${model._getTable()}/create`,
      async (request, response) => {
        try {
          const { data } = deserialize(request.body);
          const insertData = SqlBricks.insert(model._getTable(), data).toParams(
            { placeholder: '?' }
          );
          const query = await context._database.execute(
            insertData.text,
            insertData.values
          );
          response.json({ status: 'ok', result: query });
        } catch (error) {
          response.status(500).json({ status: 'error', error });
        }
      }
    );

    // Get By ID
    context.server.post(
      `/api/${model._getTable()}/getById/:id`,
      async (request, response) => {
        try {
          const { id } = request.params;
          const sql = SqlBricks.select()
            .from(model._getTable())
            .where({ _id: id })
            .toParams({ placeholder: '?' });
          const [resp] = await context._database.execute(sql.text, sql.values);
          response.json({ status: 'ok', result: resp });
        } catch (error) {
          response.status(500).json({ status: 'error', error });
        }
      }
    );

    // Update
    context.server.post(
      `/api/${model._getTable()}/update/:id`,
      async (request, response) => {
        try {
          const { data } = deserialize(request.body);
          const { id } = request.params;
          const sql = SqlBricks.update(model._getTable(), {
            ...data,
            updated_at: new Date().toISOString(),
          })
            .where({ _id: id })
            .toParams({ placeholder: '?' });
          const query = await context._database.execute(sql.text, sql.values);
          response.json({ status: 'ok', result: query });
        } catch (error) {
          response.status(500).json({ status: 'error', error });
        }
      }
    );

    // Delete
    context.server.post(
      `/api/${model._getTable()}/delete/:id`,
      async (request, response) => {
        try {
          const { id } = request.params;
          const sql = SqlBricks.delete()
            .from(model._getTable())
            .where({ _id: id })
            .toParams({ placeholder: '?' });
          const [resp] = await context._database.execute(sql.text, sql.values);
          response.json({ status: 'ok', result: resp });
        } catch (error) {
          response.status(500).json({ status: 'error', error });
        }
      }
    );

    // List
    context.server.post(
      `/api/${model._getTable()}/list/:page`,
      async (request, response) => {
        try {
          const itemsPerPage = 25;
          const { page } = request.params;
          const countSql = SqlBricks.select('count(*) as total')
            .from(model._getTable())
            .toParams({ placeholder: '?' });
          const [[count]] = await context._database.execute(
            countSql.text,
            countSql.values
          );
          const totalPages = Math.ceil(count.total / itemsPerPage);
          const pagination = {
            total: count.total,
            total_pages: totalPages,
            next_page: totalPages > parseInt(page) ? parseInt(page) + 1 : null,
            actual_page: parseInt(page),
            itens_per_page: itemsPerPage,
          };
          const offset = (page - 1) * itemsPerPage;
          const sql = mysqlBricks
            .select()
            .from(model._getTable())
            .orderBy('created_at desc')
            .limit(itemsPerPage)
            .offset(offset)
            .toParams({ placeholder: '?' });
          const [resp] = await context._database.execute(sql.text, sql.values);
          response.json({ status: 'ok', result: resp, pagination });
        } catch (error) {
          response.status(500).json({ status: 'error', error });
        }
      }
    );
  });

  return context;
};
