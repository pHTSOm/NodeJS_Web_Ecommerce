/**
 * Calculate loyalty points earned for an order
 * Points are calculated as 10% of the total order amount
 * @param {number} totalAmount - The total order amount
 * @returns {number} - The number of loyalty points earned
 */
const calculateLoyaltyPoints = (totalAmount) => {
    // Convert to number to ensure proper calculation
    const amount = parseFloat(totalAmount);
    
    // Calculate points (10% of the total amount)
    // 1 point = 1 VND (or any currency unit)
    // For example, if total is 1,000,000 VND, points = 100,000
    const points = Math.floor(amount * 0.1);
    
    return points;
  };
  
  module.exports = {
    calculateLoyaltyPoints
  };