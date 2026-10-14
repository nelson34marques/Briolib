const DATABASE_NAME = 'folia-library';
const BOOKS_STORE = 'books';
const FILES_STORE = 'files';
const HIGHLIGHTS_STORE = 'highlights';
const DB_VERSION = 3;

let dbPromise = null;

function openLibrary() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction;

      const booksStore = db.objectStoreNames.contains(BOOKS_STORE)
        ? transaction.objectStore(BOOKS_STORE)
        : db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });

      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }

      if (!db.objectStoreNames.contains(HIGHLIGHTS_STORE)) {
        db.createObjectStore(HIGHLIGHTS_STORE, { keyPath: 'id' });
      }

      if (event.oldVersion >= 1 && event.oldVersion < 2) {
        const filesStore = transaction.objectStore(FILES_STORE);
        booksStore.openCursor().onsuccess = (cursorEvent) => {
          const cursor = cursorEvent.target.result;
          if (!cursor) return;
          const record = cursor.value;
          if (record && record.file) {
            filesStore.put(record.file, record.id);
            const { file, ...meta } = record;
            cursor.update(meta);
          }
          cursor.continue();
        };
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function runTx(storeNames, mode, executor) {
  return openLibrary().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, mode);
        const stores = {};
        storeNames.forEach((name) => {
          stores[name] = transaction.objectStore(name);
        });

        const result = { value: undefined };
        transaction.oncomplete = () => resolve(result.value);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Transação cancelada'));

        try {
          executor(stores, result);
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            /* ignore */
          }
          reject(error);
        }
      }),
  );
}

export function listBooks() {
  return runTx([BOOKS_STORE], 'readonly', (stores, result) => {
    const request = stores[BOOKS_STORE].getAll();
    request.onsuccess = () => {
      result.value = request.result;
    };
  });
}

export function getBookWithFile(id) {
  return runTx([BOOKS_STORE, FILES_STORE], 'readonly', (stores, result) => {
    const book = { meta: null, file: null };
    const metaRequest = stores[BOOKS_STORE].get(id);
    const fileRequest = stores[FILES_STORE].get(id);
    metaRequest.onsuccess = () => {
      book.meta = metaRequest.result;
    };
    fileRequest.onsuccess = () => {
      book.file = fileRequest.result;
    };
    result.value = book;
  });
}

export function saveBook(meta, file) {
  return runTx([BOOKS_STORE, FILES_STORE], 'readwrite', (stores) => {
    stores[BOOKS_STORE].put(meta);
    if (file) stores[FILES_STORE].put(file, meta.id);
  });
}

export function saveProgress(id, lastPage, totalPages) {
  return runTx([BOOKS_STORE], 'readwrite', (stores, result) => {
    const request = stores[BOOKS_STORE].get(id);
    request.onsuccess = () => {
      const meta = request.result;
      if (!meta) return;
      const updated = { ...meta, lastPage, totalPages };
      stores[BOOKS_STORE].put(updated);
      result.value = updated;
    };
  });
}

export function saveThumbnail(id, thumbnail) {
  return runTx([BOOKS_STORE], 'readwrite', (stores, result) => {
    const request = stores[BOOKS_STORE].get(id);
    request.onsuccess = () => {
      const meta = request.result;
      if (!meta) return;
      const updated = { ...meta, thumbnail };
      stores[BOOKS_STORE].put(updated);
      result.value = updated;
    };
  });
}

export function saveBookmark(id, bookmarked) {
  return runTx([BOOKS_STORE], 'readwrite', (stores, result) => {
    const request = stores[BOOKS_STORE].get(id);
    request.onsuccess = () => {
      const meta = request.result;
      if (!meta) return;
      const updated = { ...meta, bookmarked };
      stores[BOOKS_STORE].put(updated);
      result.value = updated;
    };
  });
}

export function saveStoppedPage(id, stoppedPage) {
  return runTx([BOOKS_STORE], 'readwrite', (stores, result) => {
    const request = stores[BOOKS_STORE].get(id);
    request.onsuccess = () => {
      const meta = request.result;
      if (!meta) return;
      const updated = { ...meta, stoppedPage };
      stores[BOOKS_STORE].put(updated);
      result.value = updated;
    };
  });
}

export function getHighlights(id) {
  return runTx([HIGHLIGHTS_STORE], 'readonly', (stores, result) => {
    const request = stores[HIGHLIGHTS_STORE].get(id);
    request.onsuccess = () => {
      result.value = request.result?.pages ?? {};
    };
  });
}

export function saveHighlights(id, pages) {
  return runTx([HIGHLIGHTS_STORE], 'readwrite', (stores) => {
    stores[HIGHLIGHTS_STORE].put({ id, pages });
  });
}

export function deleteBook(id) {
  return runTx([BOOKS_STORE, FILES_STORE, HIGHLIGHTS_STORE], 'readwrite', (stores) => {
    stores[BOOKS_STORE].delete(id);
    stores[FILES_STORE].delete(id);
    stores[HIGHLIGHTS_STORE].delete(id);
  });
}
