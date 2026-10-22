/**
 * Shared configuration and limits for NovaBank (Client & Server)
 */
export const SHARED_LIMITS = {
  MIN_USER_AGE_YEARS: 16,
  TIMEZONE: 'Asia/Kolkata',
  RESERVED_TEST_PHONE_PREFIX: '+9170000',
  RESERVED_TEST_PHONE_REGEX: /^\+9170000\d{5}$/
};

export default SHARED_LIMITS;
