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

    context.server.post(`/api/${model._getTable()}/pull`, async (req, res) => {
      /**
       * {
       *    data: {
       *        ini: new Date();
       *        end: new Date()
       *    }
       * }
       */
      const {data} = deserialize(req.body);
      const table = model._getTable();

      // Get all updated
      const sqlUpdate = SqlBricks.select().from(table).where(SqlBricks.and(
        SqlBricks.notEq('updated_at', SqlBricks('created_at')),
        SqlBricks.between('updated_at', data.ini, data.end),
      )).toParams({placeholder: "?",})
      const [updateList] = await context._database.execute(sqlUpdate.text, sqlUpdate.values);
      const updated = updateList.map(({_id, ...data}) => {return {_id, data}})
      // Get all created
      const sqlCreate = SqlBricks.select().from(table).where(
        SqlBricks.between('created_at', data.ini, data.end),
      ).toParams({placeholder: "?",})
      const [created] = await context._database.execute(sqlCreate.text, sqlCreate.values);
      res.json({ created,  updated});
    });

    context.server.post(`/api/${model._getTable()}/push`, async (req, res) => {
      const data = deserialize(req.body);
      const table = model._getTable();
      await context._database.execute(
        "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );
      await context._database.beginTransaction();
      try {
        // Inserir os Criados
        data.created.forEach(async (createData) => {
          const sql = SqlBricks.insert(table, createData).toParams({
            placeholder: "?",
          });
          // await context._database.execute(sql.text, sql.values);
        });
        // Alterar os Que precisam
        data.updated.forEach(async (values) => {
          const { _id, data: updateData } = values;
          const sql = SqlBricks.update(table, {
            ...updateData,
            // updated_at: new Date().toISOString(),
          })
            .where(SqlBricks.and({ _id }, SqlBricks.gt('updated_at', updateData.updated_at)))
            .toParams({ placeholder: "?" });
            console.log(sql.text)
          // await context._database.execute(sql.text, sql.values);
        });
        await context._database.commit();
        res.json({ status: "ok" });
      } catch (error) {
        await context._database.rollback();
        res.status(500).json({ status: "error", error });
      }
    });
  });

  return context;
};
