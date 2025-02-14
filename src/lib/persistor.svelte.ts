let db: IDBDatabase;

const DB_NAME = 'persistor';
const STORE_NAME = 'svelte-state';

export function openDB(
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
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

export function remove(
	name: string,
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - remove record', name);
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

// TODO: T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function put<T>(
	name: string,
	value: T | undefined | null,
	error?: (error: DOMException | undefined | null) => void,
	success?: (value: T | undefined | null) => void
) {
	console.debug('persistor - put:', name, '=', value);
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

// TODO: T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function get<T>(
	name: string,
	success: (value: T) => void,
	error?: (error: DOMException | undefined | null) => void
) {
	console.debug('persistor - get', name);
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
