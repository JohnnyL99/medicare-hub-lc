import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';
import { doctorRepository } from '../repositories/DoctorRepository.js';
import { userRepository } from '../repositories/UserRepository.js';
import { USER_ROLES } from '../utils/constants.js';

export class AuthService {
  constructor(repository = userRepository, doctors = doctorRepository) {
    this.userRepository = repository;
    this.doctors = doctors;
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findActiveByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError('Credenziali non valide');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenziali non valide');
    }

    return {
      token: this.generateAccessToken(user),
      user: await this.toPublicUser(user)
    };
  }

  async getCurrentUser(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Token non valido');
    }

    return this.toPublicUser(user);
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: String(user.id),
        role: user.role
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn
      }
    );
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.jwtSecret);
    } catch {
      throw new UnauthorizedError('Token non valido');
    }
  }

  ensureRole(userRole, allowedRoles) {
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError('Ruolo non autorizzato');
    }
  }

  async toPublicUser(user) {
    const publicUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    if (user.role === USER_ROLES.DOCTOR) {
      const doctor = await this.doctors.findByUserId(Number(user.id));

      publicUser.doctorId = doctor?.id || null;
    };

    return publicUser;
  }
}

export const authService = new AuthService();
