// Values that both the models and the validation schemas need to agree on.
const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

module.exports = {
  ROLES,
  ROLE_VALUES: Object.values(ROLES),
};
