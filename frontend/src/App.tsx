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

import SummaryView from './components/SummaryView';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Initialize state from URL params to support persistence on refresh
  const searchParams = new URLSearchParams(window.location.search);
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'date_desc');
  
  const observerTarget = React.useRef(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = Object.keys(CATEGORY_ICONS);

  useEffect(() => {
    // Sync state changes to URL
    const url = new URL(window.location.href);
    if (filterCategory) url.searchParams.set('category', filterCategory);
    else url.searchParams.delete('category');
    
    if (sortOrder !== 'date_desc') url.searchParams.set('sort', sortOrder);
    else url.searchParams.delete('sort');
    
    window.history.replaceState({}, '', url);

    fetchExpenses(true);
  }, [filterCategory, sortOrder]);

  const fetchExpenses = async (reset = false) => {
    if (!navigator.onLine) {
      setGlobalError("You appear to be offline. Please check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      setGlobalError(null);
      
      const queryParams = new URLSearchParams();
      if (filterCategory) queryParams.append('category', filterCategory);
      queryParams.append('sort', sortOrder);
      if (!reset && nextCursor) queryParams.append('cursor', nextCursor);
      
      const res = await fetch(`${API_URL}/expenses?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses from server');
      
      const data = await res.json();
      
      if (reset) {
        setExpenses(data.items);
      } else {
        setExpenses(prev => [...prev, ...data.items]);
      }
      setNextCursor(data.nextCursor || null);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setGlobalError("Network error: Unable to reach the server. Please check your connection or ensure the backend is running.");
      } else {
        setGlobalError(err.message || 'An error occurred while fetching.');
      }
      setTimeout(() => setGlobalError(null), 5000);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loading && !loadingMore) {
          fetchExpenses(false);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget.current, nextCursor, loading, loadingMore]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Inline Validation
    const errors: Record<string, string> = {};
    if (parseFloat(amount) <= 0) errors.amount = 'Amount must be strictly positive';
    if (!category) errors.category = 'Category is required';
    if (description.length > 255) errors.description = 'Description cannot exceed 255 characters';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setGlobalError(null);
      setFormErrors({});

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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.errors?.[0]?.message || 'Failed to add expense');
      }
      
      setAmount('');
      setCategory('');
      setDescription('');
      
      fetchExpenses(true);
      
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setGlobalError("Network error: Unable to reach the server. Please check your connection or ensure the backend is running.");
      } else {
        setGlobalError(err.message || 'An error occurred while submitting.');
      }
      setTimeout(() => setGlobalError(null), 5000);
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
                onChange={(e) => { setAmount(e.target.value); setFormErrors(prev => ({...prev, amount: ''})) }}
                placeholder="0.00"
                className={formErrors.amount ? 'input-error' : ''}
              />
              {formErrors.amount && <span className="error-text">{formErrors.amount}</span>}
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                required
                value={category}
                onChange={(e) => { setCategory(e.target.value); setFormErrors(prev => ({...prev, category: ''})) }}
                className={formErrors.category ? 'input-error' : ''}
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.category && <span className="error-text">{formErrors.category}</span>}
            </div>
            
            <div className="form-group">
              <label>Description (Optional)</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFormErrors(prev => ({...prev, description: ''})) }}
                placeholder="e.g. Morning Coffee"
                className={formErrors.description ? 'input-error' : ''}
              />
              {formErrors.description && <span className="error-text">{formErrors.description}</span>}
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
          <SummaryView expenses={expenses} />
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
            
            {/* Intersection Observer Target for Infinite Scroll */}
            {nextCursor && (
              <div ref={observerTarget} style={{ padding: '1rem', textAlign: 'center' }}>
                {loadingMore ? <div className="loader" style={{ borderColor: 'var(--primary-color)', margin: '0 auto' }}></div> : null}
              </div>
            )}
          </div>
        </div>
      </main>

      {globalError && (
        <div className="toast">
          <AlertCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }}/>
          {globalError}
        </div>
      )}
    </div>
  );
}

export default App;
