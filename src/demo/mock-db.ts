import { Transaction, Subscription, Liability, Goal, WishlistItem } from "@/types";
import { 
    MOCK_TRANSACTIONS, 
    MOCK_SUBSCRIPTIONS, 
    MOCK_LIABILITIES, 
    MOCK_ASSETS, 
    MOCK_WISHLIST,
    MOCK_WEALTH_HISTORY
} from "./mock-data";

class MockDB {
    private transactions: Transaction[] = [];
    private subscriptions: Subscription[] = [];
    private liabilities: Liability[] = [];
    private assets: Goal[] = [];
    private wishlist: WishlistItem[] = [];
    private wealthHistory = [...MOCK_WEALTH_HISTORY];

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return;
        
        const savedTxs = localStorage.getItem('demo_transactions');
        const savedSubs = localStorage.getItem('demo_subscriptions');
        const savedLiabs = localStorage.getItem('demo_liabilities');
        const savedAssets = localStorage.getItem('demo_assets');
        const savedWish = localStorage.getItem('demo_wishlist');

        this.transactions = savedTxs ? JSON.parse(savedTxs) : MOCK_TRANSACTIONS;
        this.subscriptions = savedSubs ? JSON.parse(savedSubs) : MOCK_SUBSCRIPTIONS;
        this.liabilities = savedLiabs ? JSON.parse(savedLiabs) : MOCK_LIABILITIES;
        this.assets = savedAssets ? JSON.parse(savedAssets) : MOCK_ASSETS;
        this.wishlist = savedWish ? JSON.parse(savedWish) : MOCK_WISHLIST;
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;
        
        localStorage.setItem('demo_transactions', JSON.stringify(this.transactions));
        localStorage.setItem('demo_subscriptions', JSON.stringify(this.subscriptions));
        localStorage.setItem('demo_liabilities', JSON.stringify(this.liabilities));
        localStorage.setItem('demo_assets', JSON.stringify(this.assets));
        localStorage.setItem('demo_wishlist', JSON.stringify(this.wishlist));
    }

    reset() {
        this.transactions = MOCK_TRANSACTIONS;
        this.subscriptions = MOCK_SUBSCRIPTIONS;
        this.liabilities = MOCK_LIABILITIES;
        this.assets = MOCK_ASSETS;
        this.wishlist = MOCK_WISHLIST;
        this.saveToStorage();
    }

    // Transactions
    getTransactions() { return this.transactions; }
    addTransaction(tx: Transaction) {
        this.transactions = [tx, ...this.transactions];
        this.saveToStorage();
        return tx;
    }
    updateTransaction(id: string, updates: Partial<Transaction>) {
        this.transactions = this.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        this.saveToStorage();
        return this.transactions.find(t => t.id === id);
    }
    deleteTransaction(id: string) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage();
    }

    // Assets/Goals
    getAssets() { return this.assets; }
    addAsset(asset: Goal) {
        this.assets = [asset, ...this.assets];
        this.saveToStorage();
        return asset;
    }
    updateAsset(id: string, updates: Partial<Goal>) {
        this.assets = this.assets.map(a => a.id === id ? { ...a, ...updates } : a);
        this.saveToStorage();
        return this.assets.find(a => a.id === id);
    }
    deleteAsset(id: string) {
        this.assets = this.assets.filter(a => a.id !== id);
        this.saveToStorage();
    }

    // Subscriptions
    getSubscriptions() { return this.subscriptions; }
    addSubscription(sub: Subscription) {
        this.subscriptions = [sub, ...this.subscriptions];
        this.saveToStorage();
        return sub;
    }
    updateSubscription(id: string, updates: Partial<Subscription>) {
        this.subscriptions = this.subscriptions.map(s => s.id === id ? { ...s, ...updates } : s);
        this.saveToStorage();
        return this.subscriptions.find(s => s.id === id);
    }
    deleteSubscription(id: string) {
        this.subscriptions = this.subscriptions.filter(s => s.id !== id);
        this.saveToStorage();
    }

    // Wishlist
    getWishlist() { return this.wishlist; }
    addWish(wish: WishlistItem) {
        this.wishlist = [wish, ...this.wishlist];
        this.saveToStorage();
        return wish;
    }
    updateWish(id: string, updates: Partial<WishlistItem>) {
        this.wishlist = this.wishlist.map(w => w.id === id ? { ...w, ...updates } : w);
        this.saveToStorage();
        return this.wishlist.find(w => w.id === id);
    }
    deleteWish(id: string) {
        this.wishlist = this.wishlist.filter(w => w.id !== id);
        this.saveToStorage();
    }

    // Liabilities
    getLiabilities() { return this.liabilities; }
    addLiability(liability: Liability) {
        this.liabilities = [liability, ...this.liabilities];
        this.saveToStorage();
        return liability;
    }
    updateLiability(id: string, updates: Partial<Liability>) {
        this.liabilities = this.liabilities.map(l => l.id === id ? { ...l, ...updates } : l);
        this.saveToStorage();
        return this.liabilities.find(l => l.id === id);
    }
    deleteLiability(id: string) {
        this.liabilities = this.liabilities.filter(l => l.id !== id);
        this.saveToStorage();
    }
    
    // Wealth History
    getWealthHistory() { return this.wealthHistory; }
}

export const mockDB = new MockDB();
