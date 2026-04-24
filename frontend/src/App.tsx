import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Coffee, 
  Car, 
  Zap, 
  Film, 
  ShoppingBag, 
  Heart, 
  MoreHorizontal, 
  WalletCards,
  AlertCircle
} from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

const API_URL = 'http://localhost:3001';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food': <Coffee size={18} />,
  'Transport': <Car size={18} />,
  'Utilities': <Zap size={18} />,
  'Entertainment': <Film size={18} />,
  'Shopping': <ShoppingBag size={18} />,
  'Health': <Heart size={18} />,
  'Other': <MoreHorizontal size={18} />
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter & Sort State
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = Object.keys(CATEGORY_ICONS);

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, sortOrder]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filterCategory) queryParams.append('category', filterCategory);
      queryParams.append('sort', sortOrder);
      
      const res = await fetch(`${API_URL}/expenses?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses from server');
      
      const data = await res.json();
      setExpenses(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const idempotencyKey = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const amountInPaise = Math.round(parseFloat(amount) * 100);

      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          amount: amountInPaise,
          category,
          description,
          date
        })
      });

      if (!res.ok) throw new Error('Failed to add expense');
      
      setAmount('');
      setCategory('');
      setDescription('');
      
      fetchExpenses();
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="dashboard">
      {/* Sidebar / Form Panel */}
      <aside className="sidebar">
        <div className="brand">
          <h1><WalletCards size={28} /> Fenmo</h1>
          <p className="subtitle">Track your expenses effortlessly.</p>
        </div>

        <div className="form-panel">
          <h2>New Transaction</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input 
                type="text" 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Morning Coffee"
              />
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? <div className="loader" /> : 'Add Expense'}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-panel">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Total Visible Spent</div>
            <div className="stat-value">₹{(totalAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="list-section">
          <div className="list-header">
            <h2>Recent Activity</h2>
            <div className="filter-group">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
              </select>
            </div>
          </div>

          <div className="expense-list">
            {loading ? (
              // Skeleton Loading
              <>
                <div className="skeleton-item"></div>
                <div className="skeleton-item"></div>
                <div className="skeleton-item"></div>
              </>
            ) : expenses.length === 0 ? (
              <div className="empty-state">
                <WalletCards size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3>No expenses found</h3>
                <p>Try adjusting your filters or add a new transaction.</p>
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="expense-item">
                  <div className="item-left">
                    <div className="icon-wrapper">
                      {CATEGORY_ICONS[exp.category] || <MoreHorizontal size={18} />}
                    </div>
                    <div className="item-info">
                      <span className="item-desc">{exp.description}</span>
                      <span className="item-cat">{exp.category}</span>
                    </div>
                  </div>
                  <div className="item-right">
                    <span className="item-amount">- ₹{(exp.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="item-date">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {error && (
        <div className="toast">
          <AlertCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }}/>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
