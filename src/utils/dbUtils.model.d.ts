interface RecordExistOptions {
  schema?: string;
  tableName: string;
  colName: string;
  value: any | any[];
  excludeID?: number | string | null;
  returnRow?: boolean;
}

export default function recordExist(options: RecordExistOptions): Promise<boolean | any>;
