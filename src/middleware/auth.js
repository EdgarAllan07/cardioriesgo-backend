import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({
        message:
          "No token provided. Expected format: Authorization: Bearer <token>",
      });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    console.error("Invalid token", error);
    return res.status(403).json({ message: "Invalid token" });
  }
}
