export default {
  name: 'coworkingPricingPlan',
  title: 'Pricing Plan',
  type: 'object',
  fields: [
    { name: 'type', type: 'string' }, // e.g., Day Pass, Monthly, etc.
    { name: 'price', type: 'number' }, // THB numeric
    { name: 'period', type: 'string' }, // e.g., "per day", "per month"
  ],
};
