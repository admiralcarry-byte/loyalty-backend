const BaseModel = require('./BaseModel');
const SaleSchema = require('../schemas/Sale');
const PercentageCalculator = require('../utils/percentageCalculator');

class Sale extends BaseModel {
  constructor() {
    super(SaleSchema);
  }

  // Find sales by user
  async findByUser(userId) {
    return await this.findAll({ user_id: userId }, { orderBy: 'created_at DESC' });
  }

  // Find sales by store
  async findByStore(storeId) {
    return await this.findAll({ store_id: storeId }, { orderBy: 'created_at DESC' });
  }

  // Find sales by product
  async findByProduct(productId) {
    return await this.findAll({ product_id: productId }, { orderBy: 'created_at DESC' });
  }

  // Find sales by status
  async findByStatus(status) {
    return await this.findAll({ status }, { orderBy: 'created_at DESC' });
  }

  // Find sales by payment method
  async findByPaymentMethod(paymentMethod) {
    return await this.findAll({ payment_method: paymentMethod }, { orderBy: 'created_at DESC' });
  }

  // Get sales with user and product details
  async getSalesWithDetails(conditions = {}, options = {}) {
    try {
      let query = this.model.find(conditions)
        .populate('user_id', 'username first_name last_name email')
        .populate('product_id', 'name price')
        .populate('store_id', 'name address')
        .sort({ created_at: -1 });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.skip(options.offset);
      }

      return await query.exec();
    } catch (error) {
      console.error('Error in getSalesWithDetails:', error);
      throw error;
    }
  }

  // Get sales statistics
  async getSalesStats(conditions = {}) {
    try {
      const dateRanges = PercentageCalculator.getDateRanges();
      const matchConditions = { ...conditions };
      
      // Get current month stats
      const currentMonthPipeline = [
        { 
          $match: { 
            ...matchConditions,
            created_at: {
              $gte: dateRanges.currentMonth.start,
              $lte: dateRanges.currentMonth.end
            }
          } 
        },
        {
          $group: {
            _id: null,
            current_revenue: { $sum: '$total_amount' },
            current_liters: { $sum: '$liters_sold' },
            current_cashback: { $sum: '$cashback_earned' },
            current_commission: { $sum: '$commission_amount' }
          }
        }
      ];

      // Get previous month stats
      const previousMonthPipeline = [
        { 
          $match: { 
            ...matchConditions,
            created_at: {
              $gte: dateRanges.previousMonth.start,
              $lte: dateRanges.previousMonth.end
            }
          } 
        },
        {
          $group: {
            _id: null,
            previous_revenue: { $sum: '$total_amount' },
            previous_liters: { $sum: '$liters_sold' },
            previous_cashback: { $sum: '$cashback_earned' },
            previous_commission: { $sum: '$commission_amount' }
          }
        }
      ];

      // Get overall stats
      const overallPipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            total_sales: { $sum: 1 },
            completed_sales: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pending_sales: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            cancelled_sales: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            refunded_sales: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
            total_revenue: { $sum: '$total_amount' },
            total_liters_sold: { $sum: '$liters_sold' },
            total_points_earned: { $sum: '$points_earned' },
            total_cashback_earned: { $sum: '$cashback_earned' },
            average_sale_amount: { $avg: '$total_amount' },
            average_liters_per_sale: { $avg: '$liters_sold' }
          }
        }
      ];

      const [currentMonthResult, previousMonthResult, overallResult] = await Promise.all([
        this.model.aggregate(currentMonthPipeline),
        this.model.aggregate(previousMonthPipeline),
        this.model.aggregate(overallPipeline)
      ]);

      const currentMonth = currentMonthResult[0] || { current_revenue: 0, current_liters: 0, current_cashback: 0, current_commission: 0 };
      const previousMonth = previousMonthResult[0] || { previous_revenue: 0, previous_liters: 0, previous_cashback: 0, previous_commission: 0 };
      const overall = overallResult[0] || {};

      // Calculate growth percentages
      const revenueGrowth = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.current_revenue,
        previousMonth.previous_revenue
      );

      const litersGrowth = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.current_liters,
        previousMonth.previous_liters
      );

      const cashbackGrowth = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.current_cashback,
        previousMonth.previous_cashback
      );

      const commissionGrowth = PercentageCalculator.calculateMonthOverMonth(
        currentMonth.current_commission,
        previousMonth.previous_commission
      );

      return {
        total_sales: overall.total_sales || 0,
        completed_sales: overall.completed_sales || 0,
        pending_sales: overall.pending_sales || 0,
        cancelled_sales: overall.cancelled_sales || 0,
        refunded_sales: overall.refunded_sales || 0,
        total_revenue: overall.total_revenue || 0,
        total_liters_sold: overall.total_liters_sold || 0,
        total_points_earned: overall.total_points_earned || 0,
        total_cashback_earned: overall.total_cashback_earned || 0,
        average_sale_amount: overall.average_sale_amount || 0,
        average_liters_per_sale: overall.average_liters_per_sale || 0,
        revenue_growth_percentage: PercentageCalculator.formatPercentage(revenueGrowth),
        liters_growth_percentage: PercentageCalculator.formatPercentage(litersGrowth),
        cashback_growth_percentage: PercentageCalculator.formatPercentage(cashbackGrowth),
        commission_growth_percentage: PercentageCalculator.formatPercentage(commissionGrowth)
      };
    } catch (error) {
      console.error('Error getting sales stats:', error);
      return {
        total_sales: 0,
        completed_sales: 0,
        pending_sales: 0,
        cancelled_sales: 0,
        refunded_sales: 0,
        total_revenue: 0,
        total_liters_sold: 0,
        total_points_earned: 0,
        total_cashback_earned: 0,
        average_sale_amount: 0,
        average_liters_per_sale: 0,
        revenue_growth_percentage: '0.0',
        liters_growth_percentage: '0.0',
        cashback_growth_percentage: '0.0',
        commission_growth_percentage: '0.0'
      };
    }
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM sales 
      WHERE DATE(created_at) BETWEEN ? AND ?
      ORDER BY created_at DESC
    `;
    return await this.executeQuery(query, [startDate, endDate]);
  }

  // Get daily sales for a period
  async getDailySales(startDate, endDate) {
    const query = `
      SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as total_sales,
        SUM(total_amount) as daily_revenue,
        SUM(liters_sold) as daily_liters,
        SUM(points_earned) as daily_points,
        SUM(cashback_earned) as daily_cashback
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY sale_date DESC
    `;
    return await this.executeQuery(query, [startDate, endDate]);
  }

  // Get monthly sales for a year
  async getMonthlySales(year) {
    const query = `
      SELECT 
        MONTH(created_at) as month,
        COUNT(*) as total_sales,
        SUM(total_amount) as monthly_revenue,
        SUM(liters_sold) as monthly_liters,
        SUM(points_earned) as monthly_points,
        SUM(cashback_earned) as monthly_cashback
      FROM sales
      WHERE YEAR(created_at) = ?
      GROUP BY MONTH(created_at)
      ORDER BY month ASC
    `;
    return await this.executeQuery(query, [year]);
  }

  // Get top performing stores
  async getTopStores(limit = 10) {
    const query = `
      SELECT 
        s.store_id,
        st.name as store_name,
        COUNT(s.id) as total_sales,
        SUM(s.total_amount) as total_revenue,
        SUM(s.liters_sold) as total_liters,
        AVG(s.total_amount) as average_sale
      FROM sales s
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.status = 'completed'
      GROUP BY s.store_id
      ORDER BY total_revenue DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [limit]);
  }

  // Get top customers by sales
  async getTopCustomers(limit = 10) {
    const query = `
      SELECT 
        s.user_id,
        u.username, u.first_name, u.last_name, u.email,
        COUNT(s.id) as total_sales,
        SUM(s.total_amount) as total_spent,
        SUM(s.liters_sold) as total_liters,
        SUM(s.points_earned) as total_points,
        SUM(s.cashback_earned) as total_cashback
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'completed'
      GROUP BY s.user_id
      ORDER BY total_spent DESC
      LIMIT ?
    `;
    return await this.executeQuery(query, [limit]);
  }

  // Get sales by payment method statistics
  async getPaymentMethodStats() {
    const query = `
      SELECT 
        payment_method,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_amount
      FROM sales
      WHERE status = 'completed'
      GROUP BY payment_method
      ORDER BY total_revenue DESC
    `;
    return await this.executeQuery(query);
  }

  // Get recent sales
  async getRecentSales(limit = 20) {
    return await this.getSalesWithDetails({}, { limit });
  }

  // Get sales requiring approval
  async getPendingSales() {
    return await this.getSalesWithDetails({ status: 'pending' });
  }

  // Approve a sale
  async approveSale(saleId, approvedBy) {
    return await this.updateById(saleId, { 
      status: 'completed',
      approved_by: approvedBy,
      approved_at: new Date()
    });
  }

  // Cancel a sale
  async cancelSale(saleId, reason = null) {
    return await this.updateById(saleId, { 
      status: 'cancelled',
      notes: reason
    });
  }

  // Get sales analytics for dashboard
  async getDashboardAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
    
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = ?) as today_sales,
        (SELECT SUM(total_amount) FROM sales WHERE DATE(created_at) = ?) as today_revenue,
        (SELECT COUNT(*) FROM sales WHERE DATE_FORMAT(created_at, '%Y-%m') = ?) as month_sales,
        (SELECT SUM(total_amount) FROM sales WHERE DATE_FORMAT(created_at, '%Y-%m') = ?) as month_revenue,
        (SELECT COUNT(*) FROM sales WHERE status = 'pending') as pending_sales,
        (SELECT SUM(total_amount) FROM sales WHERE status = 'pending') as pending_revenue
    `;
    
    return await this.executeQuery(query, [today, today, thisMonth, thisMonth]);
  }

  // Get sales performance comparison
  async getPerformanceComparison(currentPeriod, previousPeriod) {
    const query = `
      SELECT 
        'current' as period,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'previous' as period,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale
      FROM sales
      WHERE DATE(created_at) BETWEEN ? AND ?
    `;
    
    return await this.executeQuery(query, [
      currentPeriod.start, currentPeriod.end,
      previousPeriod.start, previousPeriod.end
    ]);
  }
}

module.exports = Sale; 