export default {
  name: 'openingHoursEntry',
  title: 'Opening Hours Entry',
  type: 'object',
  fields: [
    { name: 'day', type: 'string', options: { list: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] } },
    { name: 'opens', type: 'string' },   // e.g. "08:00"
    { name: 'closes', type: 'string' },  // e.g. "18:00"
  ],
};