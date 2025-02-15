type DatabaseEngineType = 'localStorage' | 'sessionStorage' | 'indexedDB'

let db: IDBDatabase
let dbEngine: DatabaseEngineType

const DEFAULT_DB_NAME = 'persistor-db'
const DEFAULT_STORE_NAME = 'store'

// used when IndexedDB has configured
let dbName = DEFAULT_DB_NAME
let storeName = DEFAULT_STORE_NAME

/**
 * Init Persistor.
 * It can only be run once, otherwise throw an error.
 * IndexedDB is asynchronous, Storage is not.
 * @param databaseType database type
 * @param error database is not ready, initialization failed
 * @param success database is ready to work
 * @param indexedDBOptions only used with IndexedDB, you can set database name
 * and store name (default is persistor-db/store)
 */
export default function (
	databaseEngine: DatabaseEngineType,
	error: (error: DOMException | undefined | null) => void,
	success?: () => void,
	indexedDBOptions?: { dbName?: string; storeName?: string }
) {
	console.debug('persistor - database type is ' + databaseEngine)
	if (indexedDBOptions) {
		if (dbEngine !== 'indexedDB') {
			console.warn(
				'Persistor init options will be ignored. Options only available, when database engine is IndexedDB.'
			)
		} else {
			dbName = indexedDBOptions.dbName?.trim() || DEFAULT_DB_NAME
			storeName = indexedDBOptions.storeName?.trim() || DEFAULT_STORE_NAME
		}
	}
	if (dbEngine) {
		throw new Error('Already initialized Persistor.')
	}
	dbEngine = databaseEngine
	if (databaseEngine === 'indexedDB') {
		openDB(error, success)
	} else if (databaseEngine === 'localStorage') {
		if (window?.localStorage) {
			success?.()
		} else {
			error(new DOMException('localStorage is unreachable'))
		}
	} else if (databaseEngine === 'sessionStorage') {
		if (window?.sessionStorage) {
			success?.()
		} else {
			error(new DOMException('sessionStorage  is unreachable'))
		}
	} else {
		error(new DOMException('Unknow database engine', databaseEngine))
	}
}

/**
 * Open IndexedDB.
 * Runs during initialization phase, only for IndexedDB.
 * @param error
 * @param success
 */
function openDB(error: (error: DOMException | undefined | null) => void, success?: () => void) {
	console.debug('persistor - openDB')
	const request = window.indexedDB.open(dbName)
	request.onsuccess = (event) => {
		console.debug('persistor - openDB - request.onsuccess')
		db = (event.target as IDBOpenDBRequest)?.result
		db.onerror = (event) => {
			// Generic error handler for all errors targeted at this database's requests!
			console.error(`persistor - db.onerror: ${(event.target as IDBOpenDBRequest)?.error?.message}`)
		}
		success?.()
	}
	request.onerror = (event) => {
		const err = (event.target as IDBRequest)?.error
		console.error(`persistor - openDB - request.onerror: ${err?.message}`)
		error?.(err)
	}
	request.onupgradeneeded = (event) => {
		console.debug('persistor - openDB - request.onupgradeneeded')
		db = (event.target as IDBOpenDBRequest)?.result
		if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(storeName)) {
			const objectStore = db.createObjectStore(storeName)
			// eslint-disable-next-line
			objectStore.transaction.oncomplete = (event) => {
				console.debug(`persistor - IndexedDB - request.onupgradeneeded: ${storeName} DB created`)
				success?.()
			}
		}
	}
}

/**
 * Deletes all configured storage locations (localStorage or sessionStorage)!
 * If the db engine is IndexedDB, only the configured database is deleted.
 * @param error 
 * @param success 
 */
export function deleteDB(
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - delete DB')
	if (dbEngine === 'localStorage') {
		localStorage.clear()
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.clear()
	} else {
		db.close()
		console.debug('persistor - delete DB - close finished')
		const request = window.indexedDB.deleteDatabase(dbName)
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful DB deletion')
			success?.()
		}
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error
			console.error(`persistor - DB delete error: ${err?.message}`)
			error?.(err)
		}
	}
}

/**
 * Remove key.
 * @param key 
 * @param error only used when IndexedDB
 * @param success only used when IndexedDB
 */
export function remove(
	key: string,
	error?: (error: DOMException | undefined | null) => void,
	success?: () => void
) {
	console.debug('persistor - remove record', key)
	if (dbEngine === 'localStorage') {
		localStorage.removeItem(key)
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.removeItem(key)
	} else {
		const transaction = db.transaction([storeName], 'readwrite')
		const svelteStateObjectStore = transaction.objectStore(storeName)
		const request = svelteStateObjectStore.delete(key) as IDBRequest<undefined>
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful remove')
			success?.()
		}
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error
			console.error(`persistor - remove error: ${err?.message}`)
			error?.(err)
		}
	}
}

// TODO: in case of IndexedDB T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function put<T = string>(
	key: string,
	value: T | undefined | null,
	error?: (error: DOMException | undefined | null) => void,
	success?: (value: T | undefined | null) => void
) {
	console.debug('persistor - put:', key, '=', value)
	if (dbEngine === 'localStorage') {
		localStorage.setItem(key, JSON.stringify(value))
	} else if (dbEngine === 'sessionStorage') {
		sessionStorage.setItem(key, JSON.stringify(value))
	} else {
		const transaction = db.transaction([storeName], 'readwrite')
		const svelteStateObjectStore = transaction.objectStore(storeName)
		const request = svelteStateObjectStore.put(value, key) as IDBRequest<string>
		// eslint-disable-next-line
		request.onsuccess = (event) => {
			console.debug('persistor - successful put')
			success?.(value)
		}
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error
			console.error(`persistor - put error: ${err?.message}`)
			error?.(err)
		}
	}
}

// TODO: in case of IndexedDB T can be https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function get<T = string>(
	key: string,
	success: (value: T | null) => void,
	error?: (error: DOMException | undefined | null) => void
) {
	console.debug('persistor - get', key)
	if (dbEngine === 'localStorage') {
		success(JSON.parse(localStorage.getItem(key) as string))
	} else if (dbEngine === 'sessionStorage') {
		success(JSON.parse(sessionStorage.getItem(key) as string))
	} else {
		const transaction = db.transaction([storeName], 'readwrite')
		const svelteStateObjectStore = transaction.objectStore(storeName)
		const request = svelteStateObjectStore.get(key) as IDBRequest<string>
		request.onsuccess = (event) => {
			console.debug('persistor - successful get')
			const readFromDB = (event.target as IDBRequest<string>).result
			success(readFromDB as T)
		}
		request.onerror = (event) => {
			const err = (event.target as IDBRequest)?.error
			console.error(`persistor - get error: ${err?.message}`)
			error?.(err)
		}
	}
}
