const { sequelize } = require('../config/db');
const TitreTransport = require('./TitreTransport');
const Validation = require('./Validation');
const AuditLog = require('./AuditLog');

module.exports = {
  sequelize,
  TitreTransport,
  Validation,
  AuditLog
};
