type DatabaseEngineType = 'localStorage' | 'sessionStorage' | 'indexedDB';

let db: IDBDatabase;
let dbEngine: DatabaseEngineType;

// used when IndexedDB has configured
const DB_NAME = 'persistor';
const STORE_NAME = 'svelte-state';

/**
 *
 * @param databaseType database type
 * @param error database is not ready
 * @param success database ready
 */
export default function (
	databaseEngine: DatabaseEngineType,
	error: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - database type is ' + databaseEngine);
	dbEngine = databaseEngine;
	if (databaseEngine === 'indexedDB') {
		openDB(error, success);
	} else if (databaseEngine === 'localStorage') {
		if (window?.localStorage) {
			success?.();
		} else {
			error(new DOMException('localStorage is unreachable'));
		}
	} else if (databaseEngine === 'sessionStorage') {
		if (window?.sessionStorage) {
			success?.();
		} else {
			error(new DOMException('sessionStorage  is unreachable'));
		}
	} else {
		error(new DOMException('Unknow database engine', databaseEngine));
	}
}

/**
 * Open IndexedDB.
 * // FIXME: export migration handler, onupgradeneeded
 * @param error
 * @param success
 */
function openDB(error: (error: DOMException | undefined | null) => void, success?: () => void) {
	console.debug('persistor - initDB');
	const request = window.indexedDB.open(DB_NAME);
	request.onsuccess = (event) => {
		console.debug('persistor - initDB - request.onsuccess');
		db = (event.target as IDBOpenDBRequest)?.result;
		db.onerror = (event) => {
			// Generic error handler for all errors targeted at this database's requests!
			console.error(
				`persistor - db.onerror: ${(event.target as IDBOpenDBRequest)?.error?.message}`
			);
		};
		success?.();
	};
	request.onerror = (event) => {
		const err = (event.target as IDBRequest)?.error;
		console.error(`persistor - initDB - request.onerror: ${err?.message}`);
		error?.(err);
	};
	request.onupgradeneeded = (event) => {
		console.debug('persistor - initDB - request.onupgradeneeded');
		db = (event.target as IDBOpenDBRequest)?.result;
		if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(STORE_NAME)) {
			const objectStore = db.createObjectStore(STORE_NAME);
			// eslint-disable-next-line
			objectStore.transaction.oncomplete = (event) => {
				console.debug(`persistor - IndexedDB - request.onupgradeneeded: ${STORE_NAME} DB created`);
				success?.();
			};
		}
	};
}

export function deleteDB(
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - delete DB');
	if (dbEngine === 'localStorage') {
		localStorage.clear();
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.clear();
	} else {
		db.close();
		console.debug('persistor - delete DB - close finished');
		const request = window.indexedDB.deleteDatabase(DB_NAME);
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful DB deletion');
			success?.();
		};
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error;
			console.error(`persistor - DB delete error: ${err?.message}`);
			error?.(err);
		};
	}
}

export function remove(
	name: string,
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - remove record', name);
	if (dbEngine === 'localStorage') {
		localStorage.removeItem(name);
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.removeItem(name);
	} else {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const svelteStateObjectStore = transaction.objectStore(STORE_NAME);
		const request = svelteStateObjectStore.delete(name) as IDBRequest<undefined>;
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful remove');
			success?.();
		};
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error;
			console.error(`persistor - remove error: ${err?.message}`);
			error?.(err);
		};
	}
}

// TODO: in case of IndexedDB T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function put<T>(
	name: string,
	value: T | undefined | null,
	error?: (error: DOMException | undefined | null) => void,
	success?: (value: T | undefined | null) => void
) {
	console.debug('persistor - put:', name, '=', value);
	if (dbEngine === 'localStorage') {
		localStorage.setItem(name, JSON.stringify(value));
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.setItem(name, JSON.stringify(value));
	} else {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const svelteStateObjectStore = transaction.objectStore(STORE_NAME);
		const request = svelteStateObjectStore.put(value, name) as IDBRequest<string>;
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful put');
			success?.(value);
		};
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error;
			console.error(`persistor - put error: ${err?.message}`);
			error?.(err);
		};
	}
}

// TODO: in case of IndexedDB T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function get<T>(
	name: string,
	success: (value: T) => void,
	error?: (error: DOMException | undefined | null) => void
) {
	console.debug('persistor - get', name);
	if (dbEngine === 'localStorage') {
		success(JSON.parse(localStorage.getItem(name) as string));
	} else if (dbEngine === 'sessionStorage') {
		success(JSON.parse(sessionStorage.getItem(name) as string));
	} else {
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const svelteStateObjectStore = transaction.objectStore(STORE_NAME);
		const request = svelteStateObjectStore.get(name) as IDBRequest<string>;
		request.onsuccess = (event) => {
			console.debug('persistor - successful get');
			const readFromDB = (event.target as IDBRequest<string>).result;
			success(readFromDB as T);
		};
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error;
			console.error(`persistor - get error: ${err?.message}`);
			error?.(err);
		};
	}
}
