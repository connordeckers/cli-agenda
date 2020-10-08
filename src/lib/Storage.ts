import merge from 'deepmerge';
import keytar from 'keytar';
import { KeytarName } from './Config';
const defaults = {
  calendars: [{ account: '', id: '' }],
  // accounts: [{ account: '' }]
}

type ILocalStorage = typeof defaults;

export class LocalStorage {
  static async get(): Promise<ILocalStorage> {
    const d = await keytar.getPassword(KeytarName, "__store").then(d => d ? JSON.parse(d) : {});
    return { ...defaults, ...(d ?? {}) }
  }

  static async save(data: Partial<ILocalStorage> | ((old: ILocalStorage) => ILocalStorage)) {
    let obj;
    const curr = await this.get();
    if (typeof data === 'function') {
      obj = data.apply(null, [curr]);
    } else {
      obj = merge(curr, data);
    }

    return keytar.setPassword(KeytarName, "__store", JSON.stringify(obj));
  }
}