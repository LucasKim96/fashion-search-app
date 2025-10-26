export const parseValuesMiddleware = (req, res, next) => {
  if (req.body.values) {
    if (typeof req.body.values === "string") {
      try {
        req.body.values = JSON.parse(req.body.values);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Values phải là JSON hợp lệ" });
      }
    }
  }
  next();
};
