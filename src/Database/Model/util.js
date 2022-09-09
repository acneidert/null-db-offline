import axios from 'axios';
import SqlBricks from 'sql-bricks';
import { typeSql } from './Column';
import deserialize from 'nullstack/shared/deserialize';

export const getDropTable = (table) => {
  return `DROP TABLE IF EXISTS ${table}`;
};

export const getCreateTable = (table, schema) => {
  const columns = schema.columns
    .map((coluna) => `${coluna.name} ${typeSql(coluna.type)}`)
    .join(', ');
  return (
    `CREATE TABLE IF NOT EXISTS ${table} ` +
    ` (  _id VARCHAR(36) PRIMARY KEY, ${columns} )`
  );
};

export const makePost = async ({
  worker,
  data = {},
  table,
  action,
  param = null,
}) => {
  worker.fetching = true;
  const url = `${worker.api}/api/${table}/${action}${
    !!param ? '/' + param : ''
  }`;
  const config = {
    method: "post",
    url,
    headers: {
      "Content-Type": "text/plain",
      ...worker.headers,
    },
    data: JSON.stringify({ data } || {}),
  };
  try {
    const response = await axios(config);
    const payload = deserialize(
      JSON.stringify(response.data)
    );
    worker.responsive = true;
    worker.fetching = false;
    return payload;
  } catch (error) {
    worker.responsive = false;
    return error;
  }
};

export const getLastPullPush = (table) => {
  return [
    SqlBricks.select()
      .from('last_sync')
      .where(
        SqlBricks.and({
          table,
          action: 'pull',
        })
      )
      .toParams({ placeholder: '?%d' }),
    SqlBricks.select()
      .from('last_sync')
      .where(
        SqlBricks.and({
          table,
          action: 'push',
        })
      )
      .toParams({ placeholder: '?%d' }),
  ];
};
