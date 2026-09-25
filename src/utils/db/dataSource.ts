import { createDataSource } from './createDataSource';
import { getConfig } from './getConfig';

const { db } = getConfig();

export const dataSource = createDataSource(db);
