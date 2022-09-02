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
  const options = {
    headers: worker.headers,
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    method: 'POST',
    body: JSON.stringify({ data } || {}),
  };
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const payload = deserialize(text);
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
