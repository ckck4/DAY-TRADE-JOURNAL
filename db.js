(function () {
    const DB_NAME = 'trading_journal_db';
    const DB_VERSION = 1;
    const TRADE_STORE = 'trades';
    const SETTINGS_STORE = 'settings';
    const VIEWS_STORE = 'views';

    let dbInstance = null;

    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(TRADE_STORE)) {
                    const tradeStore = db.createObjectStore(TRADE_STORE, { keyPath: 'id' });
                    tradeStore.createIndex('by_account', 'account', { unique: false });
                    tradeStore.createIndex('by_date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(VIEWS_STORE)) {
                    const viewStore = db.createObjectStore(VIEWS_STORE, { keyPath: 'id' });
                    viewStore.createIndex('by_account', 'account', { unique: false });
                }
            };

            request.onsuccess = function (event) {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    function withStore(storeName, mode, callback) {
        return openDB().then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const result = callback(store, transaction);

            transaction.oncomplete = function () {
                resolve(result);
            };
            transaction.onerror = function () {
                reject(transaction.error);
            };
        }));
    }

    function getTradesByAccount(account) {
        return withStore(TRADE_STORE, 'readonly', store => new Promise((resolve, reject) => {
            const index = store.index('by_account');
            const request = index.getAll(IDBKeyRange.only(account));
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        }));
    }

    function getAllTrades() {
        return withStore(TRADE_STORE, 'readonly', store => new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        }));
    }

    function saveTrade(trade) {
        return withStore(TRADE_STORE, 'readwrite', store => {
            store.put(trade);
        });
    }

    function saveTradesBulk(trades) {
        return withStore(TRADE_STORE, 'readwrite', store => {
            trades.forEach(trade => store.put(trade));
        });
    }

    function deleteTrade(id) {
        return withStore(TRADE_STORE, 'readwrite', store => {
            store.delete(id);
        });
    }

    function clearTrades() {
        return withStore(TRADE_STORE, 'readwrite', store => {
            store.clear();
        });
    }

    function saveSetting(key, value) {
        return withStore(SETTINGS_STORE, 'readwrite', store => {
            store.put({ key, value });
        });
    }

    function getSetting(key) {
        return withStore(SETTINGS_STORE, 'readonly', store => new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        }));
    }

    function getAllSettings() {
        return withStore(SETTINGS_STORE, 'readonly', store => new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const settings = {};
                (request.result || []).forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        }));
    }

    function saveView(view) {
        return withStore(VIEWS_STORE, 'readwrite', store => {
            store.put(view);
        });
    }

    function getViews(account) {
        return withStore(VIEWS_STORE, 'readonly', store => new Promise((resolve, reject) => {
            if (!account) {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
                return;
            }

            const index = store.index('by_account');
            const request = index.getAll(IDBKeyRange.only(account));
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        }));
    }

    function deleteView(id) {
        return withStore(VIEWS_STORE, 'readwrite', store => {
            store.delete(id);
        });
    }

    function clearViews() {
        return withStore(VIEWS_STORE, 'readwrite', store => {
            store.clear();
        });
    }

    window.TradeJournalDB = {
        openDB,
        getTradesByAccount,
        getAllTrades,
        saveTrade,
        saveTradesBulk,
        deleteTrade,
        clearTrades,
        saveSetting,
        getSetting,
        getAllSettings,
        saveView,
        getViews,
        deleteView,
        clearViews
    };
})();
