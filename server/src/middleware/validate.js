export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = schema.parse(dataToValidate);
      if (source === 'query' || source === 'params') {
        Object.assign(req[source], validated);
      } else {
        req[source] = validated;
      }
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const issues = err.issues?.map(i => ({
          field: i.path.join('.'),
          message: i.message
        })) || [];

        const validationError = new Error(issues[0]?.message || 'Validation failed');
        validationError.statusCode = 400;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = issues;
        return next(validationError);
      }
      next(err);
    }
  };
}
