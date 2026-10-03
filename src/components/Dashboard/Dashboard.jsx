import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { loadCurrency } from '../../utils/localStorage';
import {
  fetchBudget,
  updateBudget,
  fetchExpensesByMonth,
  deleteExpense
} from '../../utils/api';
import { 
  getSpendingInsights,
  getDaysElapsedInMonth,
  getDaysRemainingInMonth
} from '../../utils/calculations';
import { ANIMATION_VARIANTS, MONTH_NAMES, SUCCESS_MESSAGES } from '../../utils/constants';
import BudgetSummary from '../BudgetSummary/BudgetSummary';
import BudgetModal from '../BudgetModal/BudgetModal';
import ExpenseForm from '../ExpenseForm/ExpenseForm';
import ExpenseList from '../ExpenseList/ExpenseList';
import CategoryChart from '../Charts/CategoryChart';
import SpendingTrend from '../Charts/SpendingTrend';
import Settings from '../Settings/Settings';
import './Dashboard.css';

function Dashboard({ theme, toggleTheme, isDark }) {
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [insights, setInsights] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Listen for budget modal open event
  useEffect(() => {
    const handleOpenBudget = () => setIsBudgetModalOpen(true);
    window.addEventListener('openBudgetModal', handleOpenBudget);
    return () => window.removeEventListener('openBudgetModal', handleOpenBudget);
  }, []);

  // Fetches the budget and this month's expenses from the API, then recalculates insights
  const loadData = async () => {
    setLoadError('');
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const [budget, monthExpenses] = await Promise.all([
        fetchBudget(),
        fetchExpensesByMonth(year, month)
      ]);

      setMonthlyBudget(budget);
      setExpenses(monthExpenses);
      setInsights(getSpendingInsights(budget, monthExpenses));
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // Deletes an expense on the server after confirmation, then refreshes the list
  const handleDeleteExpense = async (expense) => {
    if (window.confirm(`Delete "${expense.description}"?`)) {
      try {
        await deleteExpense(expense.id);
        showNotification(SUCCESS_MESSAGES.EXPENSE_DELETED);
        await loadData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Could not delete the expense. Please try again.');
      }
    }
  };

  const handleFormSuccess = (message) => {
    showNotification(message);
    loadData();
  };

  // Saves the new monthly budget to the server and refreshes the dashboard
  const handleBudgetUpdate = async (newBudget) => {
    try {
      await updateBudget(newBudget);
      setIsBudgetModalOpen(false);
      showNotification('Budget updated successfully! 💰');
      await loadData();
    } catch (error) {
      console.error('Error updating budget:', error);
      showNotification('Could not save the budget. Please try again.');
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const currentMonth = MONTH_NAMES[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const daysElapsed = getDaysElapsedInMonth();
  const daysRemaining = getDaysRemainingInMonth();
  const currency = loadCurrency();

  return (
    <div className="dashboard">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={ANIMATION_VARIANTS.staggerContainer}
        className="dashboard-container"
      >
        {/* Compact Header with Theme Toggle */}
        <motion.header 
          className="dashboard-header-compact"
          variants={ANIMATION_VARIANTS.fadeInDown}
        >
          <div className="header-left">
            <h1 className="dashboard-title-compact">
              💰 Your Budget
            </h1>
            <span className="header-month">{currentMonth} {currentYear}</span>
          </div>
          
          <div className="header-right">
            <div className="header-stats">
              <div className="stat-compact">
                <span className="stat-label-compact">Days Passed</span>
                <span className="stat-value-compact">{daysElapsed}</span>
              </div>
              <div className="stat-separator">|</div>
              <div className="stat-compact">
                <span className="stat-label-compact">Days Left</span>
                <span className="stat-value-compact">{daysRemaining}</span>
              </div>
            </div>

            {/* Theme Toggle - Same Line */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-compact"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </motion.header>

        {/* Settings Button - Compact */}
        <motion.div
          className="settings-btn-container"
          variants={ANIMATION_VARIANTS.fadeInDown}
        >
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <SettingsIcon size={16} />
            Settings & Backup
          </button>
        </motion.div>

        {/* Loading and error states for API requests */}
        {isLoading && !insights && (
          <p style={{ textAlign: 'center' }}>Loading your budget...</p>
        )}
        {loadError && (
          <div className="error-banner">
            {loadError}{' '}
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}

        {/* Budget Summary */}
        {insights && (
          <BudgetSummary 
            budget={monthlyBudget}
            insights={insights}
            currency={currency}
          />
        )}

        {/* Quick Stats */}
        <motion.div 
          className="quick-stats-grid"
          variants={ANIMATION_VARIANTS.fadeInUp}
        >
          <div className="stat-card glass">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Total Expenses</p>
              <p className="stat-number">{expenses.length}</p>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <p className="stat-label">Daily Average</p>
              <p className="stat-number">
                {currency.symbol}{insights?.dailyAverage.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <p className="stat-label">Budget/Day Left</p>
              <p className="stat-number">
                {currency.symbol}{insights?.budgetPerDay.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon">
              {insights?.topCategory?.emoji || '💡'}
            </div>
            <div className="stat-content">
              <p className="stat-label">Top Category</p>
              <p className="stat-number-small">
                {insights?.topCategory?.name || 'None yet'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div 
          className="charts-grid"
          variants={ANIMATION_VARIANTS.fadeInUp}
        >
          <CategoryChart expenses={expenses} currency={currency} />
          <SpendingTrend expenses={expenses} currency={currency} />
        </motion.div>

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          currency={currency}
        />

        {/* Add Expense Button */}
        <motion.div
          className="add-expense-fab-container"
          variants={ANIMATION_VARIANTS.scaleIn}
        >
          <button
            onClick={handleAddExpense}
            className="btn-fab"
            aria-label="Add expense"
          >
            <span style={{ fontSize: '1.5rem' }}>➕</span>
          </button>
        </motion.div>

        {/* Budget Modal */}
        {isBudgetModalOpen && (
          <BudgetModal
            currentBudget={monthlyBudget}
            onSave={handleBudgetUpdate}
            onClose={() => setIsBudgetModalOpen(false)}
            currency={currency}
          />
        )}

        {/* Expense Form Modal */}
        <ExpenseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          editingExpense={editingExpense}
        />

        {/* Settings Modal */}
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onDataImported={loadData}
        />

        {/* Notification */}
        {notification && (
          <motion.div
            className="notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {notification}
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer 
          className="dashboard-footer"
          variants={ANIMATION_VARIANTS.fadeInUp}
        >
          <p>© 2026 Student Budget Planner. Made with 💜 for students.</p>
        </motion.footer>
      </motion.div>
    </div>
  );
}

export default Dashboard;