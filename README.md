# Day Trading Journal Suite

## Concept
The Day Trading Journal Suite is a single-page, browser-based trading journal designed to help active traders capture every trade, analyze performance, and reinforce a repeatable process. It focuses on combining trade logging, performance analytics, strategy playbooks, and behavioral review in one place so traders can identify edge, improve discipline, and track progress over time.

## What it includes
- **Multi-account support** to separate performance by broker or account.  
- **Trade entry workflow** with detailed fields for trade setup, entry/exit, risk, position size, and notes.  
- **Performance dashboards** with P&L, win rate, drawdown, and other key metrics.  
- **Analytics views** for session performance, strategy comparisons, and distribution breakdowns.  
- **Strategy playbook** for documenting setups, entry/exit criteria, best timeframes, and notes.  
- **Daily review tools** for tagging emotions, discipline, mistakes, and lessons learned.  
- **Trading rules** section covering risk management and mental game guidelines.  
- **Data management** for import/export and local storage persistence in the browser.

## How to use
1. Open `daytradejournal.html` in a modern browser.
2. Select or add an account at the top of the page.
3. Record trades and notes as you trade.
4. Review analytics, sessions, and playbook insights to refine your edge.

## Data storage & migration
The journal now uses **IndexedDB** for trades, settings, and saved views, including image attachments as Blobs. LocalStorage remains as a compatibility layer for accounts, strategies, rules, notes, and UI state. On first run after upgrading, existing `localStorage` trades are migrated into IndexedDB once and tagged with a `migration_done` flag so data is not duplicated.

## Export / Import
- **Export JSON** includes trades (with images), accounts, settings, strategies, rules, notes, and saved views.
- **Export CSV** provides a flat trades export for spreadsheets.
- **Encrypted Backup** uses client-side PBKDF2 + AES-GCM to encrypt your data (password is never stored).
- **Import JSON / Encrypted** replaces existing data and restores trades into IndexedDB.

## Changelog (Premium upgrades)
- IndexedDB-backed storage with attachment support, plus one-time localStorage migration.
- Pro analytics cards (drawdown, expectancy, rule violation cost) on the dashboard.
- Monthly P/L heatmap + strategy performance table in the Analytics tab.
- Saved views in the Journal tab (save, update, delete filters).
- Pro exports: JSON/CSV, encrypted backups, and a printable monthly report.

## Changelog (UI overhaul)
- TradeZella-inspired app shell with sidebar navigation, topbar actions, and widget grid dashboard.
- New reports hub layout, playbook workspace, and strategy templates tied into the trade entry flow.
- Trade detail drawer with replay workflow, plus refined calendar heatmap and table styling.
