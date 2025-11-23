import mongoose, {
  type CallbackWithoutResultAndOptionalError,
  type Document,
  type HydratedDocument,
  Schema,
  type UpdateQuery,
  type UpdateWithAggregationPipeline,
} from 'mongoose';

export interface INewsletterSubscriber extends Document {
  email: string;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const normalizeEmail = (value: unknown): string => String(value).toLowerCase().trim();

const normalizeEmailIfPresent = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value;
  }

  return normalizeEmail(value) as T;
};

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // enforce normalization via a setter so mocks that call setters or the real mongoose
      // will always store a trimmed, lower-cased value
      set: (value: unknown) => normalizeEmailIfPresent(value),
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });

// Normalize email on update operations
type NewsletterSubscriberQuery = mongoose.Query<unknown, INewsletterSubscriber> & {
  getUpdate(): UpdateQuery<INewsletterSubscriber>;
};

const normalizeUpdateEmail = (
  update: UpdateQuery<INewsletterSubscriber> | UpdateWithAggregationPipeline | null | undefined
) => {
  if (!update || Array.isArray(update)) {
    return;
  }

  if (typeof update.email !== 'undefined' && update.email !== null) {
    update.email = normalizeEmail(update.email);
  }

  if (update.$set && typeof update.$set.email !== 'undefined' && update.$set.email !== null) {
    update.$set.email = normalizeEmail(update.$set.email);
  }
};

NewsletterSubscriberSchema.pre(
  ['findOneAndUpdate', 'updateOne'],
  function (this: NewsletterSubscriberQuery, next?: CallbackWithoutResultAndOptionalError) {
    const update = this.getUpdate();

    normalizeUpdateEmail(update);

    next?.();
  }
);

// Ensure instance-level defaults and normalization for environments using lightweight mocks.
// This runs on validate so newly constructed documents get the expected shape in tests.
NewsletterSubscriberSchema.pre(
  'validate',
  function (
    this: HydratedDocument<INewsletterSubscriber> & { createdAt?: Date; updatedAt?: Date },
    next
  ) {
    if (typeof this.email !== 'undefined' && this.email !== null) {
      this.email = normalizeEmail(this.email);
    }

    if (typeof this.confirmedAt === 'undefined') {
      this.confirmedAt = null;
    }

    if (this.isNew && NewsletterSubscriberSchema.options?.timestamps) {
      const now = new Date();
      if (!this.createdAt) {
        this.createdAt = now;
      }
      if (!this.updatedAt) {
        this.updatedAt = now;
      }
    }

    next();
  }
);

// If a model already exists but doesn't have a schema (test mocks), replace it.
const modelName = 'NewsletterSubscriber';
const existing = mongoose.models[modelName] as mongoose.Model<INewsletterSubscriber> | undefined;
let NewsletterSubscriberModel: mongoose.Model<INewsletterSubscriber>;

if (existing?.schema) {
  NewsletterSubscriberModel = existing;
} else {
  if (existing) {
    delete mongoose.models[modelName];
  }

  NewsletterSubscriberModel = mongoose.model<INewsletterSubscriber>(
    modelName,
    NewsletterSubscriberSchema
  );
}

try {
  NewsletterSubscriberModel.schema = NewsletterSubscriberSchema;
  NewsletterSubscriberModel.modelName = modelName;

  try {
    mongoose.models[modelName] = NewsletterSubscriberModel;
  } catch {
    // ignore assignment failures when mongoose.models is proxied in lightweight mocks
  }
} catch {
  // ignore mutation failures when mocks block property reassignment
}

export default NewsletterSubscriberModel;
