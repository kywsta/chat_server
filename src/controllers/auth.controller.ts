import { Request, Response } from "express";
import { AuthResponse, LoginRequest, RegisterRequest } from "../dtos";
import { ServiceManager } from "../services/service.manager";
import { AuthenticatedRequest } from "../types";
import { JWTUtil } from "../utils/jwt.util";
import { LoggerUtil } from "../utils/logger.util";

export class AuthController {
  private static getUserService() {
    return ServiceManager.getInstance().getUserService();
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;

      // Basic validation
      if (!userData.username || !userData.password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      if (userData.username.length < 3 || userData.username.length > 50) {
        res
          .status(400)
          .json({ error: "Username must be between 3 and 50 characters" });
        return;
      }

      if (userData.password.length < 6) {
        res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
        return;
      }

      const user = await AuthController.getUserService().createUser(userData);

      const token = JWTUtil.generateToken({
        userId: user.id,
        username: user.username,
      });

      const response: AuthResponse = {
        user,
        token,
      };

      LoggerUtil.info("User registered successfully", {
        username: user.username,
        userId: user.id,
      });

      res.status(201).json(response);
    } catch (error) {
      LoggerUtil.error("Registration failed", error);

      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          res.status(409).json({ error: error.message });
          return;
        }

        if (error.message.includes("required")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      res
        .status(500)
        .json({ error: "Internal server error during registration" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginRequest = req.body;

      // Basic validation
      if (!credentials.username || !credentials.password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const user = await AuthController.getUserService().authenticateUser(
        credentials
      );

      const token = JWTUtil.generateToken({
        userId: user.id,
        username: user.username,
      });

      const response: AuthResponse = {
        user,
        token,
      };

      LoggerUtil.info("User logged in successfully", {
        username: user.username,
        userId: user.id,
      });

      res.status(200).json(response);
    } catch (error) {
      LoggerUtil.error("Login failed", error);

      if (error instanceof Error) {
        if (error.message.includes("Invalid username or password")) {
          res.status(400).json({ error: error.message });
          return;
        }

        if (error.message.includes("deactivated")) {
          res.status(401).json({ error: error.message });
          return;
        }

        if (error.message.includes("required")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      res.status(500).json({ error: "Internal server error during login" });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;

      if (!authenticatedReq.user?.userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = await AuthController.getUserService().getUserById(
        authenticatedReq.user.userId
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      LoggerUtil.error("Failed to get profile", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
