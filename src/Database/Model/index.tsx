import Nullstack from 'nullstack';
import {
  constructorProps,
  createProps,
  postCreate,
  postSyncProps,
  Props,
  schemaType,
} from './types';
import { typeSql } from './Column';
import SqlBricks = require('sql-bricks');
import { v4 as uuidv4 } from 'uuid';
import { Network } from '@capacitor/network';

interface IModel {}
const getDropTable = (table) => {
  return `DROP TABLE IF EXISTS ${table}`;
};
const getCreateTable = (table, schema) => {
  const columns = schema.columns
    .map((coluna) => `${coluna.name} ${typeSql(coluna.type)}`)
    .join(', ');
  return `CREATE TABLE IF NOT EXISTS ${table}
  ( 
    _id VARCHAR(36) PRIMARY KEY,
    ${columns} 
  )`;
};
class Model<IModel> extends Nullstack<Props> {
  table: string = '';
  schema: schemaType = {
    columns: [],
  };

  constructor(ctx: constructorProps) {
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
          if (force) await tx.executeSql(getDropTable(this._getTable()));
          await tx.executeSql(
            getCreateTable(this._getTable(), this._getSchema()),
            []
          );
        } catch (error) {
          console.log('ERROR: ', error);
        }
      });
    }
  }

  static async postPull({ _database }: postSyncProps) {
    const msg = 'Hello From Back';
    console.log(msg);
    return msg;
  }
  static async postPush({ _database }: postSyncProps) {
    const msg = 'Hello From Back';
    console.log(msg);
    return msg;
  }

  getLocalChanges() {}

  async sync({ _db }) {
    const { connected } = await Network.getStatus();
    if (!connected && _db.isNative) {
    }
  }

  static async postCreate({ _database, data }: postCreate) {
    const insertData = SqlBricks.insert(this._table, data).toParams({
      placeholder: '?',
    });
    return await _database.execute(insertData.text, insertData.values);
  }

  async create({ _db, data }: createProps) {
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
      const ret = await this.postCreate({
        data: formatedData,
      });
      console.log(ret);
    }
  }

  static async postGetById({ _database, id }) {
    const sql = SqlBricks.select()
      .from(this._table)
      .where({ _id: id })
      .toParams({ placeholder: '?' });
    console.log(sql);
    const [resp] = await _database.execute(sql.text, sql.values);
    return resp;
  }

  async getById({ _db, id }) {
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
      const resp = await this.postGetById({ id });
      return resp.length > 0 ? resp[0] : null;
    }
  }

  static async postFind() {}
  async find({ query }) {}

  static async postUpdate({ _database, id, data }) {
    const sql = SqlBricks.update(this._table, {
      ...data,
      updated_at: new Date().toISOString(), // .toISOString().slice(0, 19).replace('T', ' '),
    })
      .where({ _id: id })
      .toParams({ placeholder: '?' });
    console.log(sql);
    return await _database.execute(sql.text, sql.values);
  }
  async upsert({ _db, id, data }) {
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
      return await this.postUpdate({ id, data });
    }
  }
  
  static async postDelete({_database, id}) {
    const sql = SqlBricks.delete()
      .from(this._table)
      .where({ _id: id })
      .toParams({ placeholder: '?' });
    console.log(sql);
    const [resp] = await _database.execute(sql.text, sql.values);
    return resp;
  }
  async delete({ _db, id }) {
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
      const resp = await this.postDelete({ id });
      return resp.length > 0 ? resp[0] : null;
    }
  }

  static async getList({ _database }) {
    const sql = SqlBricks.select()
      .from(this._table)
      .toParams({ placeholder: '?' });
    const [ret] = await _database.execute(sql.text, sql.values);
    return ret;
  }
  async list({ _db }) {
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
      return await this.getList();
    }
  }

  render() {
    return false;
  }
}

export default Model;
