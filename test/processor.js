function setUpdatedAt(userContext, events, done) {
    userContext.vars.updated_at = new Date().toISOString();
    return done();
  }
  
  module.exports = {
    setUpdatedAt
  };
  