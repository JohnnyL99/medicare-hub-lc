import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { swaggerSpec } from '../src/utils/swagger.js';
import { availabilityService } from '../src/services/AvailabilityService.js';
import { appointmentService } from '../src/services/AppointmentService.js';
import { dashboardService } from '../src/services/DashboardService.js';
import { doctorAdminService } from '../src/services/DoctorAdminService.js';
import { medicalServiceService } from '../src/services/MedicalServiceService.js';
import { patientService } from '../src/services/PatientService.js';
import { specialtyService } from '../src/services/SpecialtyService.js';
import { userService } from '../src/services/UserService.js';
import { userRepository } from '../src/repositories/UserRepository.js';

const demoPassword = 'Demo123!';

function createUser(overrides = {}) {
  return {
    id: 1,
    firstName: 'Aurora',
    lastName: 'Admin',
    email: 'admin@aurora.test',
    passwordHash: bcrypt.hashSync(demoPassword, 10),
    role: 'ADMIN',
    isActive: true,
    ...overrides
  };
}

function createToken(payload = {}) {
  return jwt.sign(
    {
      sub: String(payload.sub || 1),
      role: payload.role || 'ADMIN'
    },
    env.jwtSecret,
    {
      expiresIn: payload.expiresIn || '60m'
    }
  );
}

describe('API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    env.corsAllowedOrigins = ['http://localhost:5173'];
  });

  it('returns standard success response for GET /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });

  it('allows requests from configured CORS origins', async () => {
    env.corsAllowedOrigins = ['https://medicare-hub.vercel.app'];

    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://medicare-hub.vercel.app');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://medicare-hub.vercel.app'
    );
  });

  it('normalizes trailing slash in configured CORS origins', async () => {
    env.corsAllowedOrigins = ['https://medicare-hub.vercel.app'];

    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://medicare-hub.vercel.app/');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://medicare-hub.vercel.app/'
    );
  });

  it('rejects requests from non configured CORS origins', async () => {
    env.corsAllowedOrigins = ['https://medicare-hub.vercel.app'];

    const response = await request(app).get('/health').set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('builds a swagger spec with documented operations', () => {
    expect(swaggerSpec.openapi).toBe('3.0.3');
    expect(Object.keys(swaggerSpec.paths)).toContain('/api/v1/auth/login');
    expect(swaggerSpec.paths['/api/v1/auth/login'].post.summary).toBeTruthy();
  });

  it('returns not found error for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns validation error format on invalid login payload', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'not-an-email',
      password: '123'
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows correct login and returns token plus public profile', async () => {
    vi.spyOn(userRepository, 'findActiveByEmail').mockResolvedValue(createUser());

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'ADMIN@AURORA.TEST',
      password: demoPassword
    });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects login with wrong password', async () => {
    vi.spyOn(userRepository, 'findActiveByEmail').mockResolvedValue(createUser());

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@aurora.test',
      password: 'WrongPassword1!'
    });

    expect(response.status).toBe(401);
  });

  it('rejects login for inactive user without revealing email existence', async () => {
    vi.spyOn(userRepository, 'findActiveByEmail').mockResolvedValue(null);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'inactive@aurora.test',
      password: demoPassword
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenziali non valide');
  });

  it('rejects requests with missing token', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('rejects invalid or expired tokens', async () => {
    const invalidResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(invalidResponse.status).toBe(401);

    const expiredToken = jwt.sign(
      {
        sub: '1',
        role: 'ADMIN'
      },
      env.jwtSecret,
      { expiresIn: '-1m' }
    );

    const expiredResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(expiredResponse.status).toBe(401);
  });

  it('allows and denies role-based access correctly', async () => {
    const adminToken = createToken({ role: 'ADMIN' });
    const doctorToken = createToken({ role: 'DOCTOR', sub: 6 });

    const adminAllowed = await request(app)
      .get('/api/v1/admin/check')
      .set('Authorization', `Bearer ${adminToken}`);

    const adminForbidden = await request(app)
      .get('/api/v1/admin/check')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(adminAllowed.status).toBe(200);
    expect(adminForbidden.status).toBe(403);
  });

  it('returns current user on GET /auth/me', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValue(
      createUser({
        id: 2,
        firstName: 'Giulia',
        lastName: 'Rossi',
        email: 'reception1@aurora.test',
        role: 'RECEPTIONIST'
      })
    );

    const token = createToken({ sub: 2, role: 'RECEPTIONIST' });
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('RECEPTIONIST');
  });

  it('returns paginated specialties list for ADMIN', async () => {
    vi.spyOn(specialtyService, 'list').mockResolvedValue({
      data: [{ id: 1, name: 'Cardiologia' }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    });

    const response = await request(app)
      .get('/api/v1/specialties')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.totalItems).toBe(1);
  });

  it('creates medical service for admin', async () => {
    vi.spyOn(medicalServiceService, 'create').mockResolvedValue({
      id: 15,
      name: 'Nuova prestazione',
      specialtyId: 1,
      durationMinutes: 20,
      currentPrice: 50,
      isActive: true
    });

    const response = await request(app)
      .post('/api/v1/medical-services')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        specialtyId: 1,
        name: 'Nuova prestazione',
        durationMinutes: 20,
        currentPrice: 50,
        isActive: true
      });

    expect(response.status).toBe(201);
  });

  it('creates user for admin without exposing password hash', async () => {
    vi.spyOn(userService, 'create').mockResolvedValue({
      id: 50,
      firstName: 'Mario',
      lastName: 'Neri',
      email: 'mario.neri@aurora.test',
      role: 'RECEPTIONIST',
      isActive: true
    });

    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        firstName: 'Mario',
        lastName: 'Neri',
        email: 'mario.neri@aurora.test',
        password: 'Demo123!',
        role: 'RECEPTIONIST'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('forbids users list for receptionist', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST' })}`);

    expect(response.status).toBe(403);
  });

  it('creates doctor for admin', async () => {
    vi.spyOn(doctorAdminService, 'create').mockResolvedValue({
      id: 10,
      licenseNumber: 'AUR-MED-010',
      isActive: true,
      user: {
        id: 20,
        firstName: 'Marta',
        lastName: 'Blu',
        email: 'doctor.marta.blu@aurora.test',
        role: 'DOCTOR',
        isActive: true
      },
      specialty: {
        id: 1,
        name: 'Cardiologia',
        isActive: true
      },
      medicalServices: []
    });

    const response = await request(app)
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        firstName: 'Marta',
        lastName: 'Blu',
        email: 'doctor.marta.blu@aurora.test',
        password: 'Demo123!',
        specialtyId: 1,
        licenseNumber: 'AUR-MED-010',
        medicalServiceIds: []
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('updates doctor services for admin', async () => {
    vi.spyOn(doctorAdminService, 'replaceServices').mockResolvedValue({
      id: 4,
      licenseNumber: 'AUR-MED-004',
      isActive: true,
      user: {
        id: 7,
        firstName: 'Martina',
        lastName: 'Fontana',
        email: 'doctor.martina.fontana@aurora.test',
        role: 'DOCTOR',
        isActive: true
      },
      specialty: {
        id: 4,
        name: 'Pediatria',
        isActive: true
      },
      medicalServices: [
        {
          id: 7,
          specialtyId: 4,
          name: 'Visita pediatrica',
          durationMinutes: 25,
          currentPrice: 90,
          isActive: true
        }
      ]
    });

    const response = await request(app)
      .put('/api/v1/doctors/4/services')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        medicalServiceIds: [7]
      });

    expect(response.status).toBe(200);
    expect(response.body.data.medicalServices).toHaveLength(1);
  });

  it('allows doctor to read self profile and update self services', async () => {
    vi.spyOn(doctorAdminService, 'getCurrentDoctor').mockResolvedValue({
      id: 6,
      licenseNumber: 'AUR-MED-006',
      isActive: true,
      user: {
        id: 8,
        firstName: 'Luca',
        lastName: 'Moretti',
        email: 'doctor.luca.moretti@aurora.test',
        role: 'DOCTOR',
        isActive: true
      },
      specialty: {
        id: 1,
        name: 'Cardiologia',
        isActive: true
      },
      medicalServices: []
    });
    vi.spyOn(doctorAdminService, 'listAssignableServices').mockResolvedValue([
      {
        id: 3,
        name: 'Visita cardiologica',
        specialtyId: 1,
        durationMinutes: 30,
        currentPrice: 100,
        isActive: true,
        specialty: {
          id: 1,
          name: 'Cardiologia',
          isActive: true
        }
      }
    ]);
    vi.spyOn(doctorAdminService, 'replaceServices').mockResolvedValue({
      id: 6,
      licenseNumber: 'AUR-MED-006',
      isActive: true,
      medicalServices: [
        {
          id: 3,
          name: 'Visita cardiologica',
          specialtyId: 1,
          durationMinutes: 30,
          currentPrice: 100,
          isActive: true
        }
      ]
    });

    const token = createToken({ role: 'DOCTOR', sub: 8 });
    const currentResponse = await request(app)
      .get('/api/v1/doctors/me')
      .set('Authorization', `Bearer ${token}`);
    const catalogResponse = await request(app)
      .get('/api/v1/doctors/me/available-services')
      .set('Authorization', `Bearer ${token}`);
    const updateResponse = await request(app)
      .put('/api/v1/doctors/me/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicalServiceIds: [3]
      });

    expect(currentResponse.status).toBe(200);
    expect(catalogResponse.status).toBe(200);
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.medicalServices).toHaveLength(1);
  });

  it('allows doctors list to receptionist and denies doctor write', async () => {
    vi.spyOn(doctorAdminService, 'list').mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }
    });

    const listResponse = await request(app)
      .get('/api/v1/doctors')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST' })}`);

    const writeResponse = await request(app)
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST' })}`)
      .send({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'test@aurora.test',
        password: 'Demo123!',
        specialtyId: 1,
        licenseNumber: 'AUR-MED-999'
      });

    expect(listResponse.status).toBe(200);
    expect(writeResponse.status).toBe(403);
  });

  it('returns doctor-specific medical services list', async () => {
    vi.spyOn(medicalServiceService, 'list').mockResolvedValue({
      data: [{ id: 1, name: 'Visita cardiologica' }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    });

    const response = await request(app)
      .get('/api/v1/medical-services')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 4 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('allows admin patient CRUD flows', async () => {
    vi.spyOn(patientService, 'create').mockResolvedValue({
      id: 31,
      firstName: 'Anna',
      lastName: 'Ferri',
      birthDate: '1984-02-14',
      email: 'anna.ferri@patients.test',
      phone: '3201000001',
      fiscalCode: 'FKEANN84B54A001A',
      isActive: true
    });
    vi.spyOn(patientService, 'update').mockResolvedValue({
      id: 31,
      firstName: 'Anna',
      lastName: 'Ferri',
      birthDate: '1984-02-14',
      email: 'anna.ferri@patients.test',
      phone: '3201000099',
      fiscalCode: 'FKEANN84B54A001A',
      isActive: true
    });
    vi.spyOn(patientService, 'updateStatus').mockResolvedValue({
      id: 31,
      firstName: 'Anna',
      lastName: 'Ferri',
      isActive: false
    });

    const createResponse = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        firstName: 'Anna',
        lastName: 'Ferri',
        birthDate: '1984-02-14',
        email: 'anna.ferri@patients.test',
        phone: '3201000001',
        fiscalCode: 'FKEANN84B54A001A'
      });

    const updateResponse = await request(app)
      .put('/api/v1/patients/31')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        firstName: 'Anna',
        lastName: 'Ferri',
        birthDate: '1984-02-14',
        email: 'anna.ferri@patients.test',
        phone: '3201000099',
        fiscalCode: 'FKEANN84B54A001A',
        isActive: true
      });

    const statusResponse = await request(app)
      .patch('/api/v1/patients/31/status')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        isActive: false
      });

    expect(createResponse.status).toBe(201);
    expect(updateResponse.status).toBe(200);
    expect(statusResponse.status).toBe(200);
  });

  it('allows receptionist patient CRUD flows', async () => {
    vi.spyOn(patientService, 'create').mockResolvedValue({
      id: 32,
      firstName: 'Matteo',
      lastName: 'Leone',
      birthDate: '1978-11-03',
      email: 'matteo.leone@patients.test',
      phone: '3201000002',
      fiscalCode: null,
      isActive: true
    });

    const response = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST' })}`)
      .send({
        firstName: 'Matteo',
        lastName: 'Leone',
        birthDate: '1978-11-03',
        email: 'matteo.leone@patients.test',
        phone: '3201000002'
      });

    expect(response.status).toBe(201);
  });

  it('allows doctor to create a patient while keeping appointment scheduling separate', async () => {
    vi.spyOn(patientService, 'create').mockResolvedValue({
      id: 35,
      firstName: 'Elena',
      lastName: 'Verdi',
      birthDate: '1992-04-13',
      email: 'elena.verdi@patients.test',
      phone: '3201000040',
      fiscalCode: 'FKEELN92D53A001Z',
      isActive: true
    });

    const response = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 8 })}`)
      .send({
        firstName: 'Elena',
        lastName: 'Verdi',
        birthDate: '1992-04-13',
        email: 'elena.verdi@patients.test',
        phone: '3201000040',
        fiscalCode: 'FKEELN92D53A001Z'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.firstName).toBe('Elena');
  });

  it('returns doctor availabilities for receptionist', async () => {
    vi.spyOn(availabilityService, 'listByDoctor').mockResolvedValue([
      {
        id: 1,
        doctorId: 6,
        weekday: 1,
        startTime: '09:00:00',
        endTime: '12:00:00',
        isActive: true
      }
    ]);

    const response = await request(app)
      .get('/api/v1/doctors/6/availabilities')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST', sub: 2 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('forbids receptionist from creating availabilities', async () => {
    const response = await request(app)
      .post('/api/v1/doctors/6/availabilities')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST', sub: 2 })}`)
      .send({
        weekday: 1,
        startTime: '09:00:00',
        endTime: '12:00:00'
      });

    expect(response.status).toBe(403);
  });

  it('returns overlap error format for conflicting availability', async () => {
    vi.spyOn(availabilityService, 'createForDoctor').mockRejectedValue({
      code: 'AVAILABILITY_OVERLAP',
      message: 'Disponibilita sovrapposta per il medico selezionato',
      statusCode: 409,
      expose: true,
      details: []
    });

    const response = await request(app)
      .post('/api/v1/doctors/6/availabilities')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`)
      .send({
        weekday: 1,
        startTime: '09:00:00',
        endTime: '12:00:00'
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('AVAILABILITY_OVERLAP');
  });

  it('returns computed available slots', async () => {
    vi.spyOn(availabilityService, 'getAvailableSlots').mockResolvedValue({
      date: '2026-08-10',
      timezone: 'Europe/Rome',
      medicalService: {
        id: 3,
        name: 'Visita cardiologica',
        durationMinutes: 30
      },
      slots: [
        {
          startAt: '2026-08-10T06:00:00.000Z',
          endAt: '2026-08-10T06:30:00.000Z',
          startTime: '08:00:00',
          endTime: '08:30:00'
        }
      ]
    });

    const response = await request(app)
      .get('/api/v1/doctors/6/available-slots?date=2026-08-10&medicalServiceId=3')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data.slots).toHaveLength(1);
  });

  it('creates appointment for admin with snapshots', async () => {
    vi.spyOn(appointmentService, 'create').mockResolvedValue({
      id: 101,
      patientId: 30,
      doctorId: 6,
      medicalServiceId: 3,
      scheduledAt: '2026-08-17T07:00:00.000Z',
      endAt: '2026-08-17T07:30:00.000Z',
      durationMinutesSnapshot: 30,
      priceSnapshot: '120.00',
      status: 'SCHEDULED'
    });

    const response = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`)
      .send({
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-17T07:00:00.000Z'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.priceSnapshot).toBe('120.00');
  });

  it('rejects appointment overlap with dedicated error code', async () => {
    vi.spyOn(appointmentService, 'create').mockRejectedValue({
      code: 'APPOINTMENT_OVERLAP',
      message: 'Il medico ha gia un appuntamento nel periodo selezionato',
      statusCode: 409,
      expose: true,
      details: []
    });

    const response = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST', sub: 2 })}`)
      .send({
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-17T07:00:00.000Z'
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('APPOINTMENT_OVERLAP');
  });

  it('forbids doctor appointment creation', async () => {
    const response = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 8 })}`)
      .send({
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-17T07:00:00.000Z'
      });

    expect(response.status).toBe(403);
  });

  it('returns filtered appointments list', async () => {
    vi.spyOn(appointmentService, 'list').mockResolvedValue({
      data: [{ id: 101, status: 'CONFIRMED' }],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 }
    });

    const response = await request(app)
      .get('/api/v1/appointments?status=CONFIRMED&doctorId=6&dateFrom=2026-08-17T00:00:00.000Z')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.totalItems).toBe(1);
  });

  it('allows doctor to read only own appointments', async () => {
    vi.spyOn(appointmentService, 'getById').mockResolvedValue({
      id: 102,
      doctorId: 6,
      status: 'CONFIRMED'
    });

    const response = await request(app)
      .get('/api/v1/appointments/102')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 8 })}`);

    expect(response.status).toBe(200);
  });

  it('updates appointment status through explicit transition endpoint', async () => {
    vi.spyOn(appointmentService, 'updateStatus').mockResolvedValue({
      id: 103,
      status: 'CONFIRMED'
    });

    const response = await request(app)
      .patch('/api/v1/appointments/103/status')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST', sub: 2 })}`)
      .send({
        status: 'CONFIRMED'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CONFIRMED');
  });

  it('logically deletes appointment through CANCELLED status', async () => {
    vi.spyOn(appointmentService, 'cancel').mockResolvedValue({
      id: 104,
      status: 'CANCELLED'
    });

    const response = await request(app)
      .delete('/api/v1/appointments/104')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  it('returns dashboard summary for admin', async () => {
    vi.spyOn(dashboardService, 'getSummary').mockResolvedValue({
      totalAppointments: 12,
      scheduledAppointments: 3,
      confirmedAppointments: 2,
      completedAppointments: 4,
      cancelledAppointments: 2,
      noShowAppointments: 1,
      activePatients: 7,
      theoreticalRevenue: 420.5
    });

    const response = await request(app)
      .get('/api/v1/dashboard/summary?dateFrom=2026-08-01T00:00:00.000Z&dateTo=2026-08-31T23:59:59.000Z')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data.theoreticalRevenue).toBe(420.5);
  });

  it('returns dashboard trend for receptionist', async () => {
    vi.spyOn(dashboardService, 'getAppointmentsTrend').mockResolvedValue([
      {
        period: '2026-08-01',
        totalAppointments: 5,
        scheduledAppointments: 1,
        confirmedAppointments: 1,
        completedAppointments: 3,
        cancelledAppointments: 0,
        noShowAppointments: 1,
        theoreticalRevenue: 300
      }
    ]);

    const response = await request(app)
      .get('/api/v1/dashboard/appointments-trend?groupBy=day')
      .set('Authorization', `Bearer ${createToken({ role: 'RECEPTIONIST', sub: 2 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].totalAppointments).toBe(5);
  });

  it('returns dashboard by-specialty data', async () => {
    vi.spyOn(dashboardService, 'getBySpecialty').mockResolvedValue([
      {
        specialty: {
          id: 1,
          name: 'Cardiologia'
        },
        totalAppointments: 8,
        completedAppointments: 5,
        theoreticalRevenue: 500
      }
    ]);

    const response = await request(app)
      .get('/api/v1/dashboard/by-specialty')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].specialty.name).toBe('Cardiologia');
  });

  it('returns upcoming dashboard items', async () => {
    vi.spyOn(dashboardService, 'getUpcoming').mockResolvedValue([
      {
        id: 90,
        patientId: 30,
        doctorId: 6,
        medicalServiceId: 3,
        scheduledAt: '2026-08-10T08:00:00.000Z',
        endAt: '2026-08-10T08:30:00.000Z',
        durationMinutesSnapshot: 30,
        priceSnapshot: 100,
        status: 'CONFIRMED',
        patient: {
          firstName: 'Anna',
          lastName: 'Ferri'
        },
        doctor: {
          firstName: 'Luca',
          lastName: 'Moretti'
        },
        medicalService: {
          name: 'Visita cardiologica'
        },
        specialty: {
          name: 'Cardiologia'
        }
      }
    ]);

    const response = await request(app)
      .get('/api/v1/dashboard/upcoming?limit=5')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 8 })}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it('returns dashboard validation error on invalid groupBy', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/appointments-trend?groupBy=weekly')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN', sub: 1 })}`);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('supports patient search and pagination', async () => {
    vi.spyOn(patientService, 'list').mockResolvedValue({
      data: [{ id: 1, firstName: 'Anna', lastName: 'Ferri' }],
      meta: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1
      }
    });

    const response = await request(app)
      .get('/api/v1/patients?search=anna&isActive=true')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('returns duplicate patient error consistently', async () => {
    vi.spyOn(patientService, 'create').mockRejectedValue({
      statusCode: 409,
      code: 'CONFLICT',
      message: 'Codice fiscale fittizio gia esistente',
      details: [],
      expose: true
    });

    const response = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${createToken({ role: 'ADMIN' })}`)
      .send({
        firstName: 'Anna',
        lastName: 'Ferri',
        birthDate: '1984-02-14',
        email: 'anna.ferri@patients.test',
        phone: '3201000001',
        fiscalCode: 'FKEANN84B54A001A'
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('allows doctor access to linked patient', async () => {
    vi.spyOn(patientService, 'getById').mockResolvedValue({
      id: 10,
      firstName: 'Anna',
      lastName: 'Ferri',
      birthDate: '1984-02-14',
      email: 'anna.ferri@patients.test',
      phone: '3201000001',
      fiscalCode: 'FKEANN84B54A001A',
      isActive: true
    });

    const response = await request(app)
      .get('/api/v1/patients/10')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 9 })}`);

    expect(response.status).toBe(200);
  });

  it('denies doctor access to unrelated patient', async () => {
    vi.spyOn(patientService, 'getById').mockRejectedValue({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Paziente non accessibile',
      details: [],
      expose: true
    });

    const response = await request(app)
      .get('/api/v1/patients/11')
      .set('Authorization', `Bearer ${createToken({ role: 'DOCTOR', sub: 9 })}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('hides stack trace in production errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { errorHandler } = await import('../src/middlewares/errorHandler.js');

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    errorHandler(new Error('Boom'), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        details: []
      }
    });
  });
});
