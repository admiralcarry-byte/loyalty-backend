/**
 * Utility functions for calculating percentage growth and changes
 */

class PercentageCalculator {
  /**
   * Calculate percentage change between two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {number} Percentage change (can be negative)
   */
  static calculatePercentageChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate month-over-month growth percentage
   * @param {number} currentMonth - Current month value
   * @param {number} previousMonth - Previous month value
   * @returns {number} Growth percentage
   */
  static calculateMonthOverMonth(currentMonth, previousMonth) {
    return this.calculatePercentageChange(currentMonth, previousMonth);
  }

  /**
   * Calculate week-over-week growth percentage
   * @param {number} currentWeek - Current week value
   * @param {number} previousWeek - Previous week value
   * @returns {number} Growth percentage
   */
  static calculateWeekOverWeek(currentWeek, previousWeek) {
    return this.calculatePercentageChange(currentWeek, previousWeek);
  }

  /**
   * Calculate year-over-year growth percentage
   * @param {number} currentYear - Current year value
   * @param {number} previousYear - Previous year value
   * @returns {number} Growth percentage
   */
  static calculateYearOverYear(currentYear, previousYear) {
    return this.calculatePercentageChange(currentYear, previousYear);
  }

  /**
   * Format percentage for display
   * @param {number} percentage - Raw percentage value
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} Formatted percentage string
   */
  static formatPercentage(percentage, decimals = 1) {
    if (isNaN(percentage) || percentage === null || percentage === undefined) {
      return '0.0';
    }
    
    const rounded = Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return rounded.toFixed(decimals);
  }

  /**
   * Get growth trend indicator
   * @param {number} percentage - Growth percentage
   * @returns {object} Trend information
   */
  static getGrowthTrend(percentage) {
    if (percentage > 0) {
      return {
        direction: 'up',
        color: 'green',
        icon: '↗',
        text: `+${this.formatPercentage(percentage)}%`
      };
    } else if (percentage < 0) {
      return {
        direction: 'down',
        color: 'red',
        icon: '↘',
        text: `${this.formatPercentage(percentage)}%`
      };
    } else {
      return {
        direction: 'flat',
        color: 'gray',
        icon: '→',
        text: '0.0%'
      };
    }
  }

  /**
   * Calculate growth statistics for multiple metrics
   * @param {object} current - Current period data
   * @param {object} previous - Previous period data
   * @returns {object} Growth statistics
   */
  static calculateGrowthStats(current, previous) {
    const stats = {};
    
    for (const key in current) {
      if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
        const percentage = this.calculatePercentageChange(current[key], previous[key]);
        stats[key] = {
          current: current[key],
          previous: previous[key],
          percentage: percentage,
          trend: this.getGrowthTrend(percentage)
        };
      }
    }
    
    return stats;
  }

  /**
   * Get date ranges for comparison periods
   * @param {Date} baseDate - Base date (default: current date)
   * @returns {object} Date ranges for different periods
   */
  static getDateRanges(baseDate = new Date()) {
    const today = new Date(baseDate);
    today.setHours(0, 0, 0, 0);

    // Current month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    // Previous month
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    previousMonthEnd.setHours(23, 59, 59, 999);

    // Current week (Monday to Sunday)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Previous week
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const previousWeekEnd = new Date(currentWeekEnd);
    previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);

    return {
      currentMonth: { start: currentMonthStart, end: currentMonthEnd },
      previousMonth: { start: previousMonthStart, end: previousMonthEnd },
      currentWeek: { start: currentWeekStart, end: currentWeekEnd },
      previousWeek: { start: previousWeekStart, end: previousWeekEnd },
      today: { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) }
    };
  }
}

module.exports = PercentageCalculator;