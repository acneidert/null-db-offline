import Nullstack from 'nullstack';
import {
  constructorProps,
  createProps,
  Props,
  schemaType,
} from './types';
import SqlBricks = require('sql-bricks');
import { v4 as uuidv4 } from 'uuid';
import { Network } from '@capacitor/network';
import {
  getDropTable,
  getCreateTable,
  makePost,
  getLastPullPush,
} from './util';

interface IModel {}

class Model<IModel> extends Nullstack<Props> {
  table: string = '';
  schema: schemaType = {
    columns: [],
  };

  constructor(ctx?: constructorProps) {
    super(ctx);
  }

  static get _table() {
    const me = new this();
    return me._getTable();
  }

  _getTable() {
    return this.table;
  }

  _getSchema() {
    if (!this.schema.columns.find((col) => col.name === 'created_at'))
      this.schema.columns.push({ name: 'created_at', type: 'DATE' });
    if (!this.schema.columns.find((col) => col.name === 'updated_at'))
      this.schema.columns.push({ name: 'updated_at', type: 'DATE' });
    return this.schema;
  }

  static async _initDbServer({ _database, force = false, schema, table }) {
    if (force) await _database.execute(getDropTable(table));
    const ret = await _database.execute(getCreateTable(table, schema), []);
  }

  async initDatabase({ _db, force = false }) {
    if (_db.isNative) {
      _db.transaction(async (tx) => {
        try {
          if (force) tx.executeSql(getDropTable(this._getTable()));
          tx.executeSql(
            getCreateTable(this._getTable(), this._getSchema()),
            []
          );
        } catch (error) {
          console.log('ERROR: ', error);
        }
      });
    }
  }

  async sync({ _db, worker }) {
    const { connected } = await Network.getStatus();
    if (connected && _db.isNative) {
      const table = this._getTable();
      const [sqlPull, sqlPush] = getLastPullPush(table);
      const execute = async (sql) => {
        return await new Promise((resolve, reject) => {
          _db.executeSql(
            sql.text,
            sql.values,
            (res) => resolve(res.rows.length === 0 ? null : res.rows.item(0)),
            (error) => reject(error)
          );
        });
      };

      const last_pull =
        (await execute(sqlPull)) ?? new Date(1900, 1, 1).toISOString();
      const last_push =
        (await execute(sqlPush)) ?? new Date(1900, 1, 1).toISOString();
      const new_pull = new Date().toISOString();
      const new_push = new Date().toISOString();

      const pullData = await makePost({
        table,
        worker,
        action: 'pull',
        data: {
          ini: last_pull,
          end: new_pull,
        },
      });
      console.log(JSON.stringify(pullData))
    }
  }

  async create({ _db, data, worker }: createProps) {
    const formatedData = {
      _id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (_db.isNative) {
      await _db.transaction(async (tx) => {
        try {
          const insertData = SqlBricks.insert(
            this.table,
            formatedData
          ).toParams({ placeholder: '?%d' });
          return await tx.executeSql(insertData.text, insertData.values);
        } catch (error) {
          console.log('ERROR: ', error);
        }
      });
    } else {
      return await makePost({
        worker,
        data: formatedData,
        table: this._getTable(),
        action: 'create',
      });
    }
  }

  async getById({ _db, id, worker }) {
    if (_db.isNative) {
      const sql = SqlBricks.select()
        .from(this.table)
        .where({ _id: id })
        .toParams({ placeholder: '?%d' });
      return await new Promise((resolve, reject) => {
        _db.executeSql(
          sql.text,
          sql.values,
          (res) => resolve(res.rows.length === 0 ? null : res.rows.item(0)),
          (error) => reject(error)
        );
      });
    } else {
      const { result } = await makePost({
        worker,
        table: this._getTable(),
        action: 'getById',
        param: id,
      });
      // const resp = await this.postGetById({ id });
      return result.length > 0 ? result[0] : null;
    }
  }

  async upsert({ _db, id, data, worker }) {
    if (id === null) return await this.create({ data });
    if (_db.isNative) {
      const sql = SqlBricks.update(this._getTable(), data)
        .where({ _id: id })
        .toParams({ placeholder: '?%d' });
      return await _db.transaction(async (tx) => {
        try {
          return await tx.executeSql(sql.text, sql.values);
        } catch (error) {
          console.log('ERROR: ', error);
        }
      });
    } else {
      return await makePost({
        worker,
        table: this._getTable(),
        action: 'update',
        data: data,
        param: id,
      });
    }
  }

  async delete({ _db, id, worker }) {
    if (_db.isNative) {
      const sql = SqlBricks.delete()
        .from(this.table)
        .where({ _id: id })
        .toParams({ placeholder: '?%d' });
      return await new Promise((resolve, reject) => {
        _db.executeSql(
          sql.text,
          sql.values,
          (res) => resolve(res.rows.length === 0 ? null : res.rows.item(0)),
          (error) => reject(error)
        );
      });
    } else {
      return await makePost({
        worker,
        table: this._getTable(),
        action: 'delete',
        param: id,
      });
    }
  }

  async list({ _db, pg = 1, worker }) {
    if (_db.isNative) {
      const sql = SqlBricks.select()
        .from(this._getTable())
        .toParams({ placeholder: '?' });
      return await new Promise((resolve, reject) => {
        _db.executeSql(
          sql.text,
          sql.values,
          (res) => {
            const itens = [];
            for (let i = 0; i < res.rows.length; i++) {
              itens.push(res.rows.item(i));
            }
            resolve(itens);
          },
          (error) => reject(error)
        );
      });
    } else {
      return await makePost({
        worker,
        table: this._getTable(),
        action: 'list',
        param: pg,
      });
    }
  }

  render() {
    return false;
  }
}

export default Model;
