import type { NullstackServerContext } from 'nullstack';
import { typeSQLitePlugin } from '@types/cordova-sqlite-storage';
import { Connection } from '@types/mysql'

export type Props = NullstackServerContext & {
  /** Model needs this */
};

export type ModelTypes = {
  table?: string;
  schema: schemaType;
  create: ({data}) => {};
  get: ({id}) => {};
  find: ({query}) => {};
  update: ({id, data}) => {};
  delete: ({id}) => {};
}

export type columnsType = {
  name: string;
  type: 'STRING' | 'BOOLEAN' | 'INTEGER' | 'REAL' | 'DATE'
};

export type schemaType = {
  columns?: Array<columnsType>;
};

export type postSyncProps = {
  _database?: any
}

export type createProps ={
  _db?: typeSQLitePlugin;
  data: Object;
}
 export type constructorProps = {
  ctx?: NullstackServerContext
 }

 export type postCreate = {
    _database?: Connection;
    table: string;
    data: Object;
 }
