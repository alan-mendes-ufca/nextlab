function can(user, feature) {
  const authorized = user.features.includes(feature);
  return authorized;
}

const authorization = {
  can,
};

export default authorization;
