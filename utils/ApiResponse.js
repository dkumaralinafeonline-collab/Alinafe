class ApiResponse {
    constructor({ success = true, message = "Success", data = null }) {
      this.success = success;
      this.message = message;
      this.data = data;
    }
  }
  
  module.exports = ApiResponse;
  