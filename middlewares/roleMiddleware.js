// middlewares/roleMiddleware.js

const roleMiddleware = (requiredRole = "admin") => {
    return (req, res, next) => {
      try {
        // 🛑 Safety check (authMiddleware should run before this)
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized. Please login first.",
          });
        }
  
        // 🔐 Role check
        if (req.user.role !== requiredRole) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Admin only.",
          });
        }
  
        // ✅ Allowed
        next();
      } catch (error) {
        console.error("❌ Role Middleware Error:", error);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    };
  };
  
  export default roleMiddleware;
  