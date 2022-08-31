const parsed = {
    STRING: 'VARCHAR(255)',
    BOOLEAN: 'TINYINT(1)',
    INTEGER: 'INTEGER',
    REAL: 'REAL',
    DATE: 'DATETIME',
}

export const typeSql = (column) => {
    return parsed[column]
}