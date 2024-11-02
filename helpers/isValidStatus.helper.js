const validStatuses = ["initial", "doing", "finish", "pending", "notFinish"];

module.exports.isValidStatus = (status) => {
  return validStatuses.includes(status);
};
