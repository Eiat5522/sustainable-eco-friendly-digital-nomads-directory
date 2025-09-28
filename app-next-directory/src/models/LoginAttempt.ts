import mongoose, {
  Document,
  FilterQuery,
  Query,
  Schema,
  UpdateQuery,
} from 'mongoose';

export type LoginAttemptReason = 'success' | 'invalid_credentials' | 'rate_limited';

const SUCCESS_REASON: LoginAttemptReason = 'success';

export interface ILoginAttempt extends Document {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: LoginAttemptReason;
  createdAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  ip: {
    type: String,
    default: null,
  },
  success: {
    type: Boolean,
    required: true,
  },
  reason: {
    type: String,
    enum: ['success', 'invalid_credentials', 'rate_limited'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const invariantError = (path: 'success' | 'reason', message: string) => {
  const error = new mongoose.Error.ValidationError();
  error.addError(
    path,
    new mongoose.Error.ValidatorError({
      message,
      path,
    }),
  );
  return error;
};

const isValidCombination = (success: boolean, reason: LoginAttemptReason) =>
  success ? reason === SUCCESS_REASON : reason !== SUCCESS_REASON;

const isLoginAttemptReason = (value: unknown): value is LoginAttemptReason =>
  value === 'success' || value === 'invalid_credentials' || value === 'rate_limited';

LoginAttemptSchema.pre('validate', function validateInvariant(next) {
  if (!isValidCombination(this.success, this.reason)) {
    const message = this.success
      ? 'Successful login attempts must use reason "success".'
      : 'Failed login attempts cannot use reason "success".';
    return next(invariantError(this.success ? 'reason' : 'success', message));
  }
  return next();
});

type UpdateField = 'success' | 'reason';

interface ExtractedField<T> {
  value?: T;
  onInsertValue?: T;
  unset: boolean;
}

const disallowedOperators: Array<keyof UpdateQuery<ILoginAttempt>> = [
  '$inc',
  '$mul',
  '$push',
  '$addToSet',
  '$pull',
  '$pop',
  '$pullAll',
];

const extractField = <T>(update: UpdateQuery<ILoginAttempt>, field: UpdateField): ExtractedField<T> => {
  const normalized = update as Record<string, unknown>;
  const result: ExtractedField<T> = {
    unset: false,
  };

  const candidates: Array<{ value: unknown; label: string }> = [];
  const onInsertCandidates: Array<{ value: unknown; label: string }> = [];

  if (Object.prototype.hasOwnProperty.call(normalized, field)) {
    candidates.push({ value: normalized[field], label: field });
  }

  const setClause = normalized.$set as Record<string, unknown> | undefined;
  if (setClause && Object.prototype.hasOwnProperty.call(setClause, field)) {
    candidates.push({ value: setClause[field], label: '$set' });
  }

  const setOnInsertClause = normalized.$setOnInsert as Record<string, unknown> | undefined;
  if (setOnInsertClause && Object.prototype.hasOwnProperty.call(setOnInsertClause, field)) {
    onInsertCandidates.push({ value: setOnInsertClause[field], label: '$setOnInsert' });
  }

  const unsetClause = normalized.$unset as Record<string, unknown> | undefined;
  if (unsetClause && Object.prototype.hasOwnProperty.call(unsetClause, field)) {
    result.unset = true;
  }

  for (const operator of disallowedOperators) {
    const clause = normalized[operator as string] as Record<string, unknown> | undefined;
    if (clause && Object.prototype.hasOwnProperty.call(clause, field)) {
      throw invariantError(
        field,
        `Operator ${String(operator)} is not supported for ${field} on login attempts.`,
      );
    }
  }

  if (candidates.length > 0) {
    const first = candidates[0].value as T;
    for (const candidate of candidates.slice(1)) {
      if (candidate.value !== first) {
        throw invariantError(
          field,
          `Conflicting ${field} values specified via multiple update clauses (${candidate.label}).`,
        );
      }
    }
    result.value = first;
  }

  if (onInsertCandidates.length > 0) {
    const firstOnInsert = onInsertCandidates[0].value as T;
    for (const candidate of onInsertCandidates.slice(1)) {
      if (candidate.value !== firstOnInsert) {
        throw invariantError(
          field,
          `Conflicting ${field} values specified for $setOnInsert updates.`,
        );
      }
    }
    result.onInsertValue = firstOnInsert;
  }

  return result;
};

const ensureUpdateInvariant = async function ensureUpdateInvariant(
  this: Query<unknown, ILoginAttempt>,
  next: (err?: mongoose.NativeError) => void,
) {
  const update = this.getUpdate();
  if (!update) {
    return next();
  }

  if (Array.isArray(update)) {
    return next(
      invariantError('success', 'Update pipelines are not supported for login attempt invariants.'),
    );
  }

  let successField: ExtractedField<boolean>;
  let reasonField: ExtractedField<LoginAttemptReason>;

  try {
    successField = extractField<boolean>(update, 'success');
    reasonField = extractField<LoginAttemptReason>(update, 'reason');
  } catch (error) {
    return next(error as mongoose.NativeError);
  }

  if (successField.unset || reasonField.unset) {
    return next(
      invariantError('reason', 'success and reason fields cannot be unset on login attempts.'),
    );
  }

  const successValue = successField.value;
  const reasonValue = reasonField.value;

  if (successValue !== undefined && typeof successValue !== 'boolean') {
    return next(invariantError('success', 'Login attempt success must be a boolean.'));
  }

  if (reasonValue !== undefined && !isLoginAttemptReason(reasonValue)) {
    return next(invariantError('reason', 'Login attempt reason value is not recognised.'));
  }

  if (
    successValue !== undefined &&
    reasonValue !== undefined &&
    !isValidCombination(successValue, reasonValue)
  ) {
    return next(
      invariantError(
        'reason',
        successValue
          ? 'Successful login attempts must use reason "success".'
          : 'Failed login attempts cannot use reason "success".',
      ),
    );
  }

  const filter = this.getFilter();

  if (successValue !== undefined && reasonValue === undefined) {
    const conflictFilter: FilterQuery<ILoginAttempt> = {
      $and: [
        filter as FilterQuery<ILoginAttempt>,
        successValue
          ? { reason: { $ne: SUCCESS_REASON } }
          : { reason: SUCCESS_REASON },
      ],
    };

    const lookupOptions = { ...this.getOptions(), upsert: false };
    const conflict = await this.model.exists(conflictFilter).setOptions(lookupOptions);

    if (conflict) {
      return next(
        invariantError(
          'reason',
          successValue
            ? 'Cannot set success=true while keeping a non-success reason.'
            : 'Cannot set success=false while keeping reason "success".',
        ),
      );
    }
  }

  if (reasonValue !== undefined && successValue === undefined) {
    const conflictFilter: FilterQuery<ILoginAttempt> = {
      $and: [
        filter as FilterQuery<ILoginAttempt>,
        reasonValue === SUCCESS_REASON ? { success: false } : { success: true },
      ],
    };

    const lookupOptions = { ...this.getOptions(), upsert: false };
    const conflict = await this.model.exists(conflictFilter).setOptions(lookupOptions);

    if (conflict) {
      return next(
        invariantError(
          'success',
          reasonValue === SUCCESS_REASON
            ? 'Cannot set reason "success" while success is false.'
            : 'Cannot set a failure reason while success is true.',
        ),
      );
    }
  }

  if (this.getOptions().upsert) {
    const upsertSuccess = successField.onInsertValue ?? successValue;
    const upsertReason = reasonField.onInsertValue ?? reasonValue;

    if (typeof upsertSuccess !== 'boolean' || !isLoginAttemptReason(upsertReason)) {
      return next(
        invariantError(
          typeof upsertSuccess !== 'boolean' ? 'success' : 'reason',
          'Upsert operations must provide both success and reason fields.',
        ),
      );
    }

    if (!isValidCombination(upsertSuccess, upsertReason)) {
      return next(
        invariantError(
          upsertSuccess ? 'reason' : 'success',
          upsertSuccess
            ? 'Successful login attempts must use reason "success".'
            : 'Failed login attempts cannot use reason "success".',
        ),
      );
    }
  }

  return next();
};

LoginAttemptSchema.pre('updateOne', ensureUpdateInvariant);
LoginAttemptSchema.pre('updateMany', ensureUpdateInvariant);
LoginAttemptSchema.pre('findOneAndUpdate', ensureUpdateInvariant);

const LoginAttemptModel =
  (mongoose.models.LoginAttempt as mongoose.Model<ILoginAttempt>) ||
  mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);

export default LoginAttemptModel;
