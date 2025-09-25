export const successResponse = (res, data, message = "Success") => {
  res.status(200).json({ message, data });
};

export const errorResponse = (res, error, code = 500) => {
  res.status(code).json({ message: error.message || "Error", error });
};
