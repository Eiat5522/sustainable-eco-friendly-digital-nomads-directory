import mongoose from 'mongoose';

describe('mongoose mock guard', () => {
  it('provides constructors with schema metadata', () => {
    const schema = new mongoose.Schema({
      name: { type: String, required: true },
    });

    const Model = mongoose.model('MongooseMockGuardModel', schema);

    expect(typeof Model).toBe('function');
    expect(Model.schema).toBe(schema);
    expect(Model.schema.path('name')?.isRequired).toBe(true);

    const doc = new Model({ name: 'guard' });
    expect(doc.name).toBe('guard');
  });

  it('exposes cached models with schemas intact', () => {
    const cached = mongoose.models.MongooseMockGuardModel;

    expect(cached).toBeDefined();
    expect(cached?.schema).toBeDefined();
  });
});
